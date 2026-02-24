import type {
  MechaInteractionContext,
  MechaInteractionPipeline
} from "../types";

export const runInteraction = async <TPayload>(
  pipeline: MechaInteractionPipeline<TPayload> | undefined,
  context: MechaInteractionContext<TPayload>,
  run: () => void | Promise<void>
): Promise<boolean> => {
  try {
    if (pipeline?.before) {
      const allowed = await pipeline.before(context);
      if (!allowed) {
        return false;
      }
    }

    await run();
    await pipeline?.after?.(context);
    return true;
  } catch (error) {
    pipeline?.onError?.(context, error);
    return false;
  }
};
