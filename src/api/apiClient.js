// src/api/apiClient.js
import axios from 'axios';

const SERVICE_KEY = import.meta.env?.VITE_DATA_GO_KR_SERVICE_KEY ?? '';

const apiClient = axios.create({
  baseURL: 'https://apis.data.go.kr/1613000/ArvlInfoInqireService',
  params: {
    serviceKey: SERVICE_KEY,
    _type: 'json'
  }
});

export default apiClient;
