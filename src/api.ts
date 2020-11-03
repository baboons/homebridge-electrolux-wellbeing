import axios from 'axios';
import createAuthRefreshInterceptor from 'axios-auth-refresh';

const baseUrl = 'https://api.delta.electrolux.com/api';
const clientUrl =
  'https://electrolux-wellbeing-client.vercel.app/api/mu52m5PR9X';

export const createClient = async ({ username, password }) => {
  const clientToken = await fetchClientToken();
  const response = await doLogin({
    username,
    password,
    clientToken,
  });
  const { accessToken } = response.data;

  const client = axios.create({
    baseURL: baseUrl,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  });

  createAuthRefreshInterceptor(
    client,
    (failedRequest) =>
      doLogin({
        username,
        password,
        clientToken,
      }).then((tokenRefreshResponse) => {
        client.defaults.headers.common.Authorization = `Bearer ${tokenRefreshResponse.data.accessToken}`;
        failedRequest.response.config.headers[
          'Authorization'
        ] = `Bearer ${tokenRefreshResponse.data.accessToken}`;
        return Promise.resolve();
      }),
    {
      statusCodes: [400, 401],
    },
  );

  return client;
};

const fetchClientToken = async () => {
  const response = await axios.get(clientUrl, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return response.data.accessToken;
};

const doLogin = async ({ username, password, clientToken }) =>
  axios.post(
    `${baseUrl}/Users/Login`,
    {
      Username: username,
      password: password,
    },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${clientToken}`,
      },
    },
  );
