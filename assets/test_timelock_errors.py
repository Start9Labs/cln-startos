import threading
import unittest
from unittest.mock import Mock
import customer_plugin as plugin

class Tests(unittest.TestCase):
    def service(self,error):
        service=plugin.Service.__new__(plugin.Service)
        service.serial=threading.RLock()
        service._invoke=Mock(side_effect=error)
        return service

    def test_allowlisted_read_only_plan_failure(self):
        service=self.service(ValueError('grant_closed'))
        self.assertEqual(service.invoke(plugin.remote.CALL,{'operation':'plan'}),
                         {'admission_error':'grant_closed'})
        self.assertEqual(service._invoke.call_count,1)

    def test_route_hint_details_only_cross_read_only_boundary(self):
        from route_plan import RouteAdmissionError
        error=RouteAdmissionError('route_hint_entry_unknown',route_hint_count=1,max_fee_msat=10000,max_delay_blocks=576,max_hops=4)
        value=self.service(error).invoke(plugin.remote.CALL,{'operation':'plan'})
        self.assertEqual(value['admission_error'],'route_hint_entry_unknown')
        self.assertEqual(value['admission_details'],error.details)
        with self.assertRaises(RouteAdmissionError):self.service(error).invoke(plugin.remote.CALL,{'operation':'send'})

    def test_unknown_errors_and_mutation_outcomes_are_not_promoted(self):
        for op,error in [('plan',ValueError('PRIVATE')),('send',ValueError('recipient_invoice_cltv_limit')),
                         ('plan',TimeoutError('PRIVATE'))]:
            service=self.service(error)
            with self.assertRaises(type(error)):service.invoke(plugin.remote.CALL,{'operation':op})
            self.assertEqual(service._invoke.call_count,1)
