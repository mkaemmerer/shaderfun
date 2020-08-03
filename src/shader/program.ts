import { Expr } from './lang'
import { Shader, decl, run as runShader } from './shader'

export type Program = (e: Expr) => Shader<Expr>

export const composeM = (f: Program) => (g: Program): Program => (p) =>
  f(p).flatMap(decl).flatMap(g)

export const run = (program: Program) => runShader(program(Expr.Var('p')))
