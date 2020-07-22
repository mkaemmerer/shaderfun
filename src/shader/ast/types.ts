import { Maybe } from '../../data/maybe'

export type Type = TypeBool | TypeNumber | TypeVec

export interface TypeVec {
  kind: 'Type.Vec'
  toString: () => string
}
export interface TypeNumber {
  kind: 'Type.Number'
  toString: () => string
}
export interface TypeBool {
  kind: 'Type.Bool'
  toString: () => string
}

export const Type = {
  Vec: {
    kind: 'Type.Vec',
    toString() {
      return 'Vec'
    },
  } as Type,
  Number: {
    kind: 'Type.Number',
    toString() {
      return 'Number'
    },
  } as Type,
  Bool: {
    kind: 'Type.Bool',
    toString() {
      return 'Bool'
    },
  } as Type,
}

export const literalType = (lit: any): Type => {
  switch (typeof lit) {
    case 'number':
      return Type.Number
    case 'boolean':
      return Type.Bool
  }
}

const equalTypes = (t1: Type, t2: Type): boolean => t1.kind === t2.kind

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
