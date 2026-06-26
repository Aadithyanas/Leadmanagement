/**
 * Amplify Data Schema (Gen 2)

 * This defines the GraphQL schema for the LeadFlow application.
 * When using Amplify Gen 2, place this in amplify/data/resource.ts
 * 
 * To use:
 * 1. npx ampx sandbox       (local dev)
 * 2. npx ampx pipeline-deploy (production)
 */

import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  Lead: a
    .model({
      name: a.string().required(),
      company: a.string().default(''),
      phone: a.string().default(''),
      email: a.string().default(''),
      status: a.enum([
        'New',
        'Contacted',
        'Qualified',
        'ProposalSent',
        'Won',
        'Lost',
      ]),
      lastDiscussion: a.string().default(''),
      followUpAt: a.datetime(),
      discussions: a.hasMany('Discussion', 'leadId'),
    })
    .authorization((allow) => [allow.owner()]),

  Discussion: a
    .model({
      leadId: a.id().required(),
      lead: a.belongsTo('Lead', 'leadId'),
      note: a.string().required(),
      followUpAt: a.datetime(),
    })
    .authorization((allow) => [allow.owner()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});
