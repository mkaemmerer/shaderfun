import { State } from '../monad/state'
import { Expr } from './ast'

const id = <T>(x: T): T => x

type Var = string
type K = (expr: Expr) => Expr
type BuilderState = { count: number; cont: K }
export type AstBuilder<T> = State<BuilderState, T>

const emptyState = { count: 0, cont: id }

export const sequenceM = <T>(arrM: AstBuilder<T>[]): AstBuilder<T[]> =>
  arrM.reduce(
    (arrM, valM) =>
      arrM.flatMap((arr) => valM.flatMap((val) => pure([...arr, val]))),
    pure([] as T[])
  )

// Action creators
export const empty: AstBuilder<any> = State.of(null)

export const pure = <T>(v: T): AstBuilder<T> => State.of(v)

const newVar = (): AstBuilder<Var> =>
  State.get<BuilderState>().flatMap(({ count, cont }) =>
    State.set({ count: count + 1, cont }).map(() => `var_${count}`)
  )

export const decl = (expr: Expr): AstBuilder<Expr> =>
  newVar().flatMap((v) =>
    State.get<BuilderState>()
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

export const run = (ctx: AstBuilder<Expr>): Expr => {
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

export const Do = (gen): AstBuilder<any> => {
  const g = gen()
  const step = (data) => {
    const { done, value } = g.next(data)
    return done ? value : value.flatMap(cached(step))
  }
  return step(undefined)
}
