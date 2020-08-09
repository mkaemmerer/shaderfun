import { Expr } from './ast'
import { Program, run } from './program'
import { print } from './print'
import { normalize } from './normalize'

export const compile = (program: Program): string => {
  const result: Expr = run(program)
  const normalized = normalize(result)
  return print(normalized)
}
