import { VersionGraph } from '@start9labs/start-sdk'
import { current } from './current'
import { v_26_6_2_0 } from './v26.6.2_0'
import { v_26_6_8_3 } from './v26.6.8_3'

export const versionGraph = VersionGraph.of({
  current,
  other: [v_26_6_2_0, v_26_6_8_3],
})
