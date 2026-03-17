import { up as up001 } from './001_initial_collections.js';
import { up as up002 } from './002_marketplace_collections.js';
import { up as up005 } from './005_integration_configuration.js';
import { up as up006 } from './006_integration_analytics.js';
import { up as up007 } from './007_integration_observability_update.js';
import { up as up008 } from './008_distributed_trace_system.js';
import { up as up009 } from './009_execution_io_capture.js';
import { up as up010 } from './010_execution_replay_system.js';
import { up as up011 } from './011_rate_limits_collections.js';

export const migrations = [
  { name: '001_initial_collections', up: up001 },
  { name: '002_marketplace_collections', up: up002 },
  { name: '005_integration_configuration', up: up005 },
  { name: '006_integration_analytics', up: up006 },
  { name: '007_integration_observability_update', up: up007 },
  { name: '008_distributed_trace_system', up: up008 },
  { name: '009_execution_io_capture', up: up009 },
  { name: '010_execution_replay_system', up: up010 },
  { name: '011_rate_limits_collections', up: up011 }
];
