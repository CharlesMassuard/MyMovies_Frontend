export const getApiErrorMessage = (error, fallback) => {
  const responseMessage = error?.response?.data?.message;

  if (typeof responseMessage === 'string' && responseMessage.trim()) {
    return responseMessage;
  }

  if (typeof error?.response?.data === 'string' && error.response.data.trim()) {
    return error.response.data;
  }

  if (error?.request && !error?.response) {
    return fallback.network;
  }

  return fallback.generic;
};
