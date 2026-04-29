/**
 * 决策树节点类型
 */
export enum NodeType {
  DECISION = 'decision', // 决策节点 (矩形)
  CHANCE = 'chance',     // 机会节点 (圆形)
  TERMINAL = 'terminal', // 终端节点 (三角形/末端)
}

/**
 * 决策树节点接口
 */
export interface TreeNode {
  id: string;
  type: NodeType;
  label: string;
  value?: number;      // 收益/支出值 (仅用于终端节点)
  cost?: number;       // 实施成本 (主要用于机会节点)
  probability?: number; // 几率 (仅用于机会节点的子分支)
  children: string[];  // 子节点 ID 列表
  parentId?: string;
  expectedValue?: number; // 计算得到的期望值
  bestOptionId?: string;  // 决策节点选中的最佳支路 ID
}

/**
 * 求解日志接口
 */
export interface CalculationLog {
  id: string;
  nodeId: string;
  message: string;
  formula: string;
  result: number;
}
