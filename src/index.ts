import { SDF, point, box, circle } from './shader/lang'
import { emptyState } from './shader/shader-context'
import { Expr, print } from './shader/ast'

const buildSDF = (sdf: SDF) => {
  const [, runSDF] = sdf.run(emptyState)
  const result = runSDF(Expr.Var('p'))
  return print(result)
}

console.log(buildSDF(point))
console.log(buildSDF(circle(10)))
console.log(buildSDF(box({ x: 10, y: 10 })))
