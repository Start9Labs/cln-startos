import { VersionGraph } from '@start9labs/start-sdk'
import { current } from './current'
import { v_26_6_1_1 } from './v26.6.1.1'

export const versionGraph = VersionGraph.of({
  current,
  other: [v_26_6_1_1],
})
