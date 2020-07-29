import { State } from '../monad/state'
import { Expr, Type } from './lang'

type Var = string
type K = (expr: Expr) => Expr
type ShaderState = { count: number; cont: K }

const id = <T>(x: T): T => x
export const emptyState = { count: 0, cont: id }

export type Shader<T> = State<ShaderState, T>

export const sequenceM = <T>(arrM: Shader<T>[]): Shader<T[]> =>
  arrM.reduce(
    (arrM, valM) =>
      arrM.flatMap((arr) => valM.flatMap((val) => pure([...arr, val]))),
    pure([] as T[])
  )

// Action creators
export const empty: Shader<any> = State.of(null)

export const pure = <T>(v: T): Shader<T> => State.of(v)

const newVar = (): Shader<Var> =>
  State.get<ShaderState>().flatMap(({ count, cont }) =>
    State.set({ count: count + 1, cont }).map(() => `var_${count}`)
  )

export const decl = (expr: Expr): Shader<Expr> =>
  newVar().flatMap((v) =>
    State.get<ShaderState>()
      .flatMap(({ count, cont }) => {
        const newCont: K = (body: Expr) =>
          cont(
            Expr.Bind({
              variable: v,
              value: expr,
              body: body,
            })
          )
        return State.set({ count, cont: newCont })
      })
      .flatMap(() => pure(Expr.Var(v)))
  )

export const run = (ctx: Shader<Expr>): Expr => {
  const [{ cont }, expr] = ctx.run(emptyState)
  return cont(expr)
}

const cached = (f) => {
  let value = undefined
  return (x) => {
    if (value === undefined) {
      value = f(x)
    }
    return value
  }
}

export const Do = (gen): Shader<any> => {
  const g = gen()
  const step = (data) => {
    const { done, value } = g.next(data)
    return done ? value : value.flatMap(cached(step))
  }
  return step(undefined)
}
