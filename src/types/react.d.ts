// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- `{}` is the "no extra props" default
type Parent<T = {}> = T & { children?: React.ReactNode };
