import { createServerFeature } from '@payloadcms/richtext-lexical';

export const cleanstartAddMenuFeature = createServerFeature({
  feature: {
    ClientFeature:
      '@/payload/admin/components/AddMenu/CleanstartAddMenuFeatureClient#CleanstartAddMenuFeatureClient',
  },
  key: 'cleanstartAddMenu',
});
