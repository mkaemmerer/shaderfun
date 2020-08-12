import { Expr } from '.'
import { AstBuilder, decl, run as runShader, pure } from './ast-builder'

export type Program = (e: Expr) => AstBuilder<Expr>
export type Transform = (program: Program) => Program

export const overDomain = (f: Program): Transform => (program: Program) => (
  p
) => f(p).flatMap(decl).flatMap(program)

export const overRange = (f: Program): Transform => (program: Program) => (p) =>
  program(p).flatMap(decl).flatMap(f)

const composeM2 = (f: Program, g: Program): Program => (p) =>
  f(p).flatMap(decl).flatMap(g)

export const composeM = (...ps: Program[]): Program =>
  ps.reduce(composeM2, (x) => pure(x))

export const run = (program: Program) => runShader(program(Expr.Var('p')))
