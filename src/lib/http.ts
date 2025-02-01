import axios from 'axios';

/**
 * 创建axios实例
 */
export const http = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
http.interceptors.request.use(
  (config) => {
    // TODO: 可以在这里添加token等认证信息
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
http.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    const { response } = error;

    // 处理错误响应
    if (response?.data) {
      return Promise.reject(new Error(response.data.message || '请求失败'));
    }

    // 处理网络错误
    if (!response) {
      return Promise.reject(new Error('网络错误，请检查您的网络连接'));
    }

    return Promise.reject(error);
  }
);
