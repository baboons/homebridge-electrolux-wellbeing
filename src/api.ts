import axios from 'axios';

//const clientSecret = 'vIpsOBEenIvjbawqL4HA29';
const baseUrl = 'https://api.delta.electrolux.com/api';

export const createClient = async ({clientSecret, username, password}) => {
  const clientToken = await refreshClientToken(clientSecret);
  const userToken = await refreshUserToken({username, password, clientToken});

  return axios.create({
    baseURL: baseUrl,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userToken}`,
    },
  });
};


const refreshClientToken = async clientSecret => {
  const response = await axios.post(`${baseUrl}/Clients/Wellbeing`, {
    ClientSecret: clientSecret,
  }, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return response.data.accessToken;
};

const refreshUserToken = async ({username, password, clientToken}) => {
  const response = await axios.post(`${baseUrl}/Users/Login`, {
    Username: username,
    password: password,
    
  }, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${clientToken}`,
    },
  });
  
  return response.data.accessToken;
};