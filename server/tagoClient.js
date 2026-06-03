import axios from 'axios';
import { config } from './config.js';
import { normalizeItems } from './normalizers.js';

export class ApiError extends Error {
  constructor(message, code, status = 500) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

const getErrorCode = (status) => {
  if (status === 401) return 'api_key_error';
  if (status === 403) return 'api_permission_error';
  return 'upstream_api_error';
};

export const requestTagoItems = async (serviceBaseUrl, operation, params = {}) => {
  if (!config.serviceKey) {
    throw new ApiError('공공데이터 서비스 키가 설정되지 않았습니다.', 'missing_service_key', 500);
  }

  try {
    const response = await axios.get(`${serviceBaseUrl}/${operation}`, {
      params: {
        serviceKey: config.serviceKey,
        _type: 'json',
        cityCode: config.cityCode,
        numOfRows: 100,
        pageNo: 1,
        ...params
      }
    });

    const header = response.data?.response?.header;
    if (header?.resultCode && header.resultCode !== '00') {
      throw new ApiError(header.resultMsg ?? '공공데이터 응답 오류입니다.', 'upstream_result_error', 502);
    }

    return normalizeItems(response.data?.response?.body?.items?.item);
  } catch (error) {
    if (error instanceof ApiError) throw error;

    const status = error?.response?.status ?? 500;
    throw new ApiError('공공데이터 API 호출에 실패했습니다.', getErrorCode(status), status === 500 ? 502 : status);
  }
};
