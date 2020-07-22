import { State } from '../monad/state'
import { Expr } from './ast'
import { Type } from './ast/types'

type Var = string
type K = (expr: Expr) => Expr
type ShaderState = { count: number; cont: K }

const id = (x) => x
export const emptyState = { count: 0, cont: id }

export type ShaderContext<T> = State<ShaderState, T>

export const sequenceM = <T>(arrM: ShaderContext<T>[]): ShaderContext<T[]> =>
  arrM.reduce(
    (arrM, valM) =>
      arrM.flatMap((arr) => valM.flatMap((val) => pure([...arr, val]))),
    pure([] as T[])
  )

// Action creators
export const empty: ShaderContext<any> = State.of(null)

export const pure = <T>(v: T): ShaderContext<T> => State.of(v)

const newVar = (): ShaderContext<Var> =>
  State.get<ShaderState>().flatMap(({ count, cont }) =>
    State.set({ count: count + 1, cont }).map(() => `var_${count}`)
  )

export const decl = (type: Type, expr: Expr): ShaderContext<Expr> =>
  newVar().flatMap((v) =>
    State.get<ShaderState>()
      .flatMap(({ count, cont }) => {
        const newCont: K = (body: Expr) =>
          cont(
            Expr.Bind({
              variable: v,
              type: type,
              value: expr,
              body: body,
            })
          )
        return State.set({ count, cont: newCont })
      })
      .flatMap(() => pure(Expr.Var(v)))
  )

export const run = (ctx: ShaderContext<Expr>): Expr => {
  const [{ cont }, expr] = ctx.run(emptyState)
  return cont(expr)
}
