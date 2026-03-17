
import pb from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';

export class IOService {
  
  async getExecutionIO(executionId) {
    try {
      const records = await pb.collection('integration_execution_io').getFullList({
        filter: `execution_id="${executionId}"`,
        expand: 'integration_id,version_id',
        $autoCancel: false
      });

      if (records.length === 0) {
        return null;
      }

      return this._parseRecord(records[0]);
    } catch (error) {
      logger.error(`Error fetching IO for execution ${executionId}:`, error);
      throw error;
    }
  }

  async getExecutionInput(executionId) {
    const io = await this.getExecutionIO(executionId);
    if (!io) return null;

    return {
      execution_id: io.execution_id,
      input_payload: io.input_payload,
      context: io.context,
      input_truncated: io.input_truncated
    };
  }

  async getExecutionOutput(executionId) {
    const io = await this.getExecutionIO(executionId);
    if (!io) return null;

    return {
      execution_id: io.execution_id,
      output_payload: io.output_payload,
      output_truncated: io.output_truncated
    };
  }

  async getExecutionError(executionId) {
    const io = await this.getExecutionIO(executionId);
    if (!io) return null;

    return {
      execution_id: io.execution_id,
      error_payload: io.error_payload,
      error_truncated: io.error_truncated
    };
  }

  _parseRecord(record) {
    const parseJson = (str) => {
      if (!str) return null;
      try {
        return JSON.parse(str);
      } catch (e) {
        return { raw: str, parse_error: true };
      }
    };

    return {
      ...record,
      input_payload: parseJson(record.input_payload_json),
      context: parseJson(record.context_json),
      output_payload: parseJson(record.output_payload_json),
      error_payload: parseJson(record.error_payload_json)
    };
  }
}

export function createIOService() {
  return new IOService();
}

export const ioService = createIOService();
