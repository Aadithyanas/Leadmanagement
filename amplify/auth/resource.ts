import { defineAuth } from '@aws-amplify/backend';

export const auth = defineAuth({
  loginWith: {
    email: {
      verificationEmailStyle: 'CODE',
      verificationEmailSubject: 'Welcome to LeadFlow - Verify your email',
    },
  },
  userAttributes: {
    preferredUsername: {
      mutable: true,
      required: false,
    },
  },
});
