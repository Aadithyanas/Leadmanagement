/**
 * AWS Amplify Configuration
 * 
 * Replace these values with your actual Amplify project outputs.
 * After running `amplify push`, values will be in aws-exports.js
 */

export const amplifyConfig = {
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID || 'us-east-1_XXXXXXXXX',
      userPoolClientId: import.meta.env.VITE_COGNITO_CLIENT_ID || 'xxxxxxxxxxxxxxxxxxxxxxxxxx',
      loginWith: {
        email: true,
      },
      signUpVerificationMethod: 'code' as const,
      userAttributes: {
        email: { required: true },
        name: { required: true },
      },
      passwordFormat: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireNumbers: true,
      },
    },
  },
  API: {
    GraphQL: {
      endpoint: import.meta.env.VITE_GRAPHQL_ENDPOINT || 'https://xxxxxxxxxx.appsync-api.us-east-1.amazonaws.com/graphql',
      defaultAuthMode: 'userPool' as const,
    },
  },
};
