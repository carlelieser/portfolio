import { Type, type Static } from '@sinclair/typebox';

export const CTAResponseSchema = Type.Object(
	{
		cta: Type.String({
			description: 'A short call-to-action button label, maximum 5 words',
			maxLength: 50
		}),
		reasoning: Type.Optional(
			Type.String({
				description: 'Brief explanation of why this CTA was chosen'
			})
		)
	},
	{
		$id: 'CTAResponse',
		additionalProperties: false
	}
);

export type CTAResponse = Static<typeof CTAResponseSchema>;
