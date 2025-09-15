// Route types
export type Route = {
  path: string;
  element: React.ReactNode;
  layout: React.ComponentType<any>;
  protected?: boolean;
};
