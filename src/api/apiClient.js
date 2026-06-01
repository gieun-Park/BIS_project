// src/api/apiClient.js
import axios from 'axios';

// 공공데이터포털 일반인증키
const SERVICE_KEY = "98955ba2c0c39a0738dd74d5e93c066bd78f6870fb38d9f4b236e6e549caaa4d"; 

const apiClient = axios.create({
  baseURL: 'https://apis.data.go.kr/1613000/ArvlInfoInqireService',
  params: {
    serviceKey: SERVICE_KEY,
    _type: 'json'
  }
});

export default apiClient;
