import { createServerFeature } from '@payloadcms/richtext-lexical';

export const cleanstartAddMenuFeature = createServerFeature({
  feature: {
    ClientFeature:
      '@/payload/admin/components/AddMenu/CleanstartAddMenuFeatureClient.ts#CleanstartAddMenuFeatureClient',
  },
  key: 'cleanstartAddMenu',
});
