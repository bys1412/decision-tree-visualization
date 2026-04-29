import { NodeType, TreeNode } from './types';

/**
 * 示例数据：新产品开发决策
 */
export const INITIAL_TREE_DATA: Record<string, TreeNode> = {
  'root': {
    id: 'root',
    type: NodeType.DECISION,
    label: '购买决策',
    children: ['apt', 'office', 'wh'],
    parentId: undefined
  },
  // 公寓楼分支
  'apt': {
    id: 'apt',
    type: NodeType.CHANCE,
    label: '购买公寓楼',
    children: ['apt-good', 'apt-poor'],
    parentId: 'root'
  },
  'apt-good': {
    id: 'apt-good',
    type: NodeType.TERMINAL,
    label: '良好经济状况',
    value: 50000,
    probability: 0.6,
    children: [],
    parentId: 'apt'
  },
  'apt-poor': {
    id: 'apt-poor',
    type: NodeType.TERMINAL,
    label: '较差经济状况',
    value: 30000,
    probability: 0.4,
    children: [],
    parentId: 'apt'
  },
  // 办公楼
  'office': {
    id: 'office',
    type: NodeType.CHANCE,
    label: '购买办公楼',
    children: ['office-good', 'office-poor'],
    parentId: 'root'
  },
  'office-good': {
    id: 'office-good',
    type: NodeType.TERMINAL,
    label: '良好经济状况',
    value: 100000,
    probability: 0.6,
    children: [],
    parentId: 'office'
  },
  'office-poor': {
    id: 'office-poor',
    type: NodeType.TERMINAL,
    label: '较差经济状况',
    value: -40000,
    probability: 0.4,
    children: [],
    parentId: 'office'
  },
  // 仓库
  'wh': {
    id: 'wh',
    type: NodeType.CHANCE,
    label: '购买仓库',
    children: ['wh-good', 'wh-poor'],
    parentId: 'root'
  },
  'wh-good': {
    id: 'wh-good',
    type: NodeType.TERMINAL,
    label: '良好经济状况',
    value: 30000,
    probability: 0.6,
    children: [],
    parentId: 'wh'
  },
  'wh-poor': {
    id: 'wh-poor',
    type: NodeType.TERMINAL,
    label: '较差经济状况',
    value: 10000,
    probability: 0.4,
    children: [],
    parentId: 'wh'
  }
};

/**
 * 布局计算
 */
interface NodeLayout {
  x: number;
  y: number;
}

export function calculateLayout(
  nodes: Record<string, TreeNode>,
  nodeWidth = 180,
  nodeHeight = 100,
  levelGap = 240,
  siblingGap = 40
): Record<string, NodeLayout> {
  const layout: Record<string, NodeLayout> = {};
  
  // 简单的层次化布局算法
  const computeWidth = (nodeId: string): number => {
    const node = nodes[nodeId];
    if (node.children.length === 0) return nodeHeight;
    return node.children.reduce((acc, childId) => acc + computeWidth(childId), 0) + (node.children.length - 1) * siblingGap;
  };

  const arrange = (nodeId: string, level: number, offset: number) => {
    const node = nodes[nodeId];
    const totalWidth = computeWidth(nodeId);
    const x = level * levelGap;
    const y = offset + totalWidth / 2;
    
    layout[nodeId] = { x, y };
    
    let currentOffset = offset;
    node.children.forEach(childId => {
      arrange(childId, level + 1, currentOffset);
      currentOffset += computeWidth(childId) + siblingGap;
    });
  };

  arrange('root', 0, 0);
  return layout;
}

/**
 * 求解算法 (逆推归纳法)
 */
export function solveTree(nodes: Record<string, TreeNode>): {
  solvedNodes: Record<string, TreeNode>;
  logs: Array<{ nodeId: string; msg: string; formula: string; result: number }>;
} {
  // 使用深拷贝避免直接修改 React 状态中的对象引用
  const solved: Record<string, TreeNode> = JSON.parse(JSON.stringify(nodes));
  const logs: any[] = [];

  const solveNode = (nodeId: string): number => {
    const node = solved[nodeId];
    
    if (node.type === NodeType.TERMINAL) {
      const val = node.value || 0;
      node.expectedValue = val;
      // 终端节点虽然不参与复杂的 EMV 逻辑，但也记录一条日志，方便逐步显示
      logs.push({
        nodeId,
        msg: `终端节点 [${node.label}] 确定数值`,
        formula: `Value = ${val}`,
        result: val
      });
      return val;
    }

    const childValues = node.children.map(id => ({
      id,
      val: solveNode(id),
      prob: solved[id].probability || 0,
      label: solved[id].label
    }));

    if (node.type === NodeType.CHANCE) {
      // 期望值 = Σ (概率 * 子节点值) - 成本
      const baseEv = childValues.reduce((acc, c) => acc + (c.val * c.prob), 0);
      const cost = node.cost || 0;
      const ev = baseEv - cost;
      
      const probabilityCalculation = childValues.map(c => `(${c.prob} * ${c.val})`).join(' + ');
      const formula = cost > 0 
        ? `(${probabilityCalculation}) - ${cost}`
        : probabilityCalculation;

      logs.push({
        nodeId,
        msg: `机会节点 [${node.label}] 计算期望值${cost > 0 ? '（已减去成本）' : ''}`,
        formula: `EV = ${formula}`,
        result: ev
      });
      node.expectedValue = ev;
      return ev;
    } else {
      // 决策节点：选择最大期望值
      const maxVal = Math.max(...childValues.map(c => c.val));
      const bestId = childValues.find(c => c.val === maxVal)?.id;
      logs.push({
        nodeId,
        msg: `决策节点 [${node.label}] 选择最佳方案`,
        formula: `Max(${childValues.map(c => c.val).join(', ')})`,
        result: maxVal
      });
      node.expectedValue = maxVal;
      node.bestOptionId = bestId;
      return maxVal;
    }
  };

  solveNode('root');
  return { solvedNodes: solved, logs };
}
