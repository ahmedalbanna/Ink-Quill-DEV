export const STATIC_MODELS: Record<string, string[]> = {
  openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  anthropic: ['claude-3-5-sonnet-20240620', 'claude-3-opus-20240229', 'claude-3-haiku-20240307'],
  google: ['gemini-3-flash-preview', 'gemini-1.5-pro', 'gemini-1.5-flash', 'text-embedding-004'],
  pipeline: ['Xenova/all-MiniLM-L6-v2', 'Xenova/distilbert-base-uncased-distilled-squad']
};

export const DEFAULT_MARKDOWN = `Here is a detailed guide to **Conducting Gap Analysis (Feature comparison matrices)** written for a **Senior System Analyst & Requirements Engineer**. You will use gap analysis to compare current systems, vendor products, or as-is vs to-be states, and produce actionable requirements for closing the gaps.

## Conducting Gap Analysis (Feature comparison matrices)

As a **Senior System Analyst**, gap analysis is one of your most valuable tools for **bridging the present state to a desired future state**. Whether you are evaluating a commercial off-the-shelf (COTS) product, migrating from a legacy system, or comparing your solution against competitors, you will produce **feature comparison matrices** that drive investment decisions, requirement prioritization, and project scope.

This content covers:
- What gap analysis is (and isn't).
- Step-by-step process for conducting it.

### Feature Comparison Matrix

| Feature | System A (Current) | System B (To-Be) | Gap Status |
| :--- | :--- | :--- | :--- |
| **Real-time Collaboration** | No | Yes | Critical Gap |
| **Markdown Export** | Partial | Full | Minor Gap |
| **AI Writing Partner** | No | Yes | Strategic Gap |
| **Versioning** | Yes | Yes | No Gap |

Enjoy your writing journey with Ink & Quill!
`;
