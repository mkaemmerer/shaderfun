import { State } from '../monad/state'

type Var = string
type VarState = { count: number }

export const emptyState = { count: 0 }

export type ShaderContext<T> = State<VarState, T>

export const sequenceM = <T>(arrM: ShaderContext<T>[]): ShaderContext<T[]> =>
  arrM.reduce(
    (arrM, valM) =>
      arrM.flatMap((arr) => valM.flatMap((val) => pure([...arr, val]))),
    pure([] as T[])
  )

// Action creators
export const empty: ShaderContext<any> = State.of(null)

export const pure = <T>(v: T): ShaderContext<T> => State.of(v)

export const newVar = (): ShaderContext<Var> =>
  State.get<VarState>().flatMap(({ count }) =>
    State.set({ count: count + 1 }).map(() => `var_${count}`)
  )
