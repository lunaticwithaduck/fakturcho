export interface PublicConfigDto {
  dualDisplayUntil: string;
}

export const RENDER_TEMPLATE_IDS = ['classic'] as const;
export type RenderTemplateId = (typeof RENDER_TEMPLATE_IDS)[number];
