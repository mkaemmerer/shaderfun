import match from '../util/match'
import { Maybe } from '../data/maybe'

export type Type = TypeArrow | TypeBool | TypeS | TypeV2 | TypeCol

export interface TypeArrow {
  kind: 'Type.Arrow'
  input: Type[]
  output: Type
}
export interface TypeS {
  kind: 'Type.S'
}
export interface TypeV2 {
  kind: 'Type.V2'
}
export interface TypeCol {
  kind: 'Type.Col'
}
export interface TypeBool {
  kind: 'Type.Bool'
}

export const Type = {
  Arrow: (input: Type[], output: Type): Type => ({
    kind: 'Type.Arrow',
    input,
    output,
  }),
  S: { kind: 'Type.S' } as Type,
  V2: { kind: 'Type.V2' } as Type,
  Col: { kind: 'Type.Col' } as Type,
  Bool: { kind: 'Type.Bool' } as Type,
}

export const literalType = (lit: any): Type => {
  switch (typeof lit) {
    case 'number':
      return Type.S
    case 'boolean':
      return Type.Bool
  }
}

export const printType = (t: Type) =>
  match(t, {
    'Type.Arrow': ({ input, output }) =>
      `(${input.map(printType).join(', ')}) -> ${printType(output)}`,
    'Type.S': () => 'S',
    'Type.V2': () => 'V2',
    'Type.Col': () => 'Col',
    'Type.Bool': () => 'Bool',
  })

export const isArrow = (t: Type): t is TypeArrow => t.kind === 'Type.Arrow'

const allEqual = (t1: Type[], t2: Type[]): boolean => {
  if (t1.length !== t2.length) return false
  return t1.every((_, i) => equalTypes(t1[i], t2[i]))
}

const equalTypes = (t1: Type, t2: Type): boolean =>
  isArrow(t1) && isArrow(t2)
    ? allEqual(t1.input, t2.input) && equalTypes(t1.output, t2.output)
    : t1.kind === t2.kind

export const unify = (t1: Type, t2: Type): Maybe<Type> => {
  if (equalTypes(t1, t2)) {
    return Maybe.just(t1)
  }
  return Maybe.nothing()
}

export const unifyAll = (types: Type[]): Maybe<Type> =>
  types.length === 0
    ? Maybe.nothing()
    : types.reduce(
        (acc, t) => acc.flatMap((t2) => unify(t, t2)),
        Maybe.just(types[0])
      )
