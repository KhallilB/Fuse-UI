/**
 * Figma API response types.
 * @see https://developers.figma.com/docs/rest-api/variables-endpoints/
 */

export interface FigmaVariable {
  id: string;
  name: string;
  key: string;
  variable_collection_id: string;
  resolved_type: "BOOLEAN" | "FLOAT" | "STRING" | "COLOR";
  description: string;
  hidden_from_publishing: boolean;
  scopes: Array<{
    node_id: string;
    node_name: string;
    node_type: string;
  }>;
  code_syntax: Record<string, string>;
  values_by_mode: Record<string, FigmaVariableValue>;
  remote: boolean;
  created_at: string;
  updated_at: string;
}

export interface FigmaVariableValue {
  type: "VALUE" | "ALIAS";
  value?: string | number | boolean;
  resolvedType?: "BOOLEAN" | "FLOAT" | "STRING" | "COLOR";
}

export interface FigmaVariableCollection {
  id: string;
  name: string;
  key: string;
  modes: Array<{
    mode_id: string;
    name: string;
  }>;
  default_mode_id: string;
  remote: boolean;
  hidden_from_publishing: boolean;
  created_at: string;
  updated_at: string;
}

export interface FigmaVariablesResponse {
  meta: {
    variables: Record<string, FigmaVariable>;
  };
}

export interface FigmaVariableCollectionsResponse {
  meta: {
    variableCollections: Record<string, FigmaVariableCollection>;
  };
}

export interface FigmaErrorResponse {
  err: string;
  status?: number;
}
