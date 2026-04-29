/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  Calculator, 
  Play, 
  ChevronRight, 
  Layers, 
  Settings2,
  X,
  RotateCcw,
  MousePointer2,
  Hand
} from 'lucide-react';
import { NodeType, TreeNode, CalculationLog as CalcLogType } from './types';
import { INITIAL_TREE_DATA, calculateLayout, solveTree } from './treeUtils';
import { useZoomPan } from './useZoomPan';
import { PasswordGate } from './components/PasswordGate';

export default function App() {
  const [nodes, setNodes] = useState<Record<string, TreeNode>>(INITIAL_TREE_DATA);
  const [solvedResults, setSolvedResults] = useState<Record<string, TreeNode> | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isSolved, setIsSolved] = useState(false);
  const [logs, setLogs] = useState<CalcLogType[]>([]);
  const [currentStep, setCurrentStep] = useState(-1);
  
  const { transform, containerRef, handleMouseDown, handleWheel } = useZoomPan();

  const layout = useMemo(() => calculateLayout(nodes), [nodes]);

  // 工具函数
  const addNode = (parentId: string, type: NodeType) => {
    const id = `node-${Date.now()}`;
    const newNode: TreeNode = {
      id,
      type,
      label: type === NodeType.TERMINAL ? '新输出' : (type === NodeType.CHANCE ? '新机会' : '新决策'),
      children: [],
      parentId,
      probability: type === NodeType.TERMINAL || nodes[parentId].type === NodeType.CHANCE ? 0.5 : undefined,
      value: type === NodeType.TERMINAL ? 0 : undefined,
    };

    setNodes(prev => ({
      ...prev,
      [id]: newNode,
      [parentId]: {
        ...prev[parentId],
        children: [...prev[parentId].children, id]
      }
    }));
    setSelectedNodeId(id);
    setIsSolved(false);
    setSolvedResults(null);
  };

  const deleteNode = (id: string) => {
    if (id === 'root') return;
    const parentId = nodes[id].parentId!;
    
    const removeRecursive = (targetId: string, currentNodes: Record<string, TreeNode>) => {
      const node = currentNodes[targetId];
      node.children.forEach(childId => removeRecursive(childId, currentNodes));
      delete currentNodes[targetId];
    };

    setNodes(prev => {
      const next = { ...prev };
      next[parentId] = {
        ...next[parentId],
        children: next[parentId].children.filter(cid => cid !== id)
      };
      removeRecursive(id, next);
      return next;
    });
    setSelectedNodeId(null);
    setIsSolved(false);
    setSolvedResults(null);
  };

  const updateNode = (id: string, updates: Partial<TreeNode>) => {
    setNodes(prev => ({
      ...prev,
      [id]: { ...prev[id], ...updates }
    }));
    setIsSolved(false);
    setSolvedResults(null);
  };

  const handleSolve = (auto: boolean) => {
    const { solvedNodes, logs: newLogs } = solveTree(nodes);
    setSolvedResults(solvedNodes); // 存储最终计算结果但不立即应用到展示节点
    setLogs(newLogs as any);
    setIsSolved(true);
    setCurrentStep(auto ? newLogs.length - 1 : -1);
  };

  const handleNextStep = () => {
    if (currentStep < logs.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleReset = () => {
    setIsSolved(false);
    setCurrentStep(-1);
    setLogs([]);
    setSolvedResults(null);
  };

  const selectedNode = selectedNodeId ? nodes[selectedNodeId] : null;

  // 判断节点是否已在当前步骤完成计算
  const isNodeCalculated = (nodeId: string) => {
    return isSolved && logs.slice(0, currentStep + 1).some(log => log.nodeId === nodeId);
  };

  return (
    <PasswordGate>
    <div className="flex h-screen w-full bg-slate-50 flex-col text-slate-800 font-sans select-none overflow-hidden">
      {/* 顶部导航栏 */}
      <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-30 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold shadow-md shadow-blue-200">D</div>
          <h1 className="text-lg font-semibold tracking-tight">决策树专业分析建模器 <span className="text-xs font-normal text-slate-400 ml-2">v2.4.0</span></h1>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex bg-slate-100 p-1 rounded-md">
            <button 
              className={`px-4 py-1.5 text-sm rounded-md font-medium transition-all ${!isSolved ? 'bg-white shadow-sm text-blue-600' : 'text-slate-600'}`}
              onClick={handleReset}
            >
              编辑模式
            </button>
            <button 
              className={`px-4 py-1.5 text-sm rounded-md font-medium transition-all ${isSolved ? 'bg-white shadow-sm text-blue-600' : 'text-slate-600'}`}
              onClick={() => handleSolve(true)}
            >
              分析模式
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* 左侧属性栏 */}
        <aside className="w-72 bg-white border-r border-slate-200 p-5 flex flex-col space-y-6 z-20">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Settings2 className="w-3 h-3" /> 节点属性
            </h3>
            
            {selectedNode ? (
              <div className="space-y-4 animate-in fade-in slide-in-from-left-2 duration-300">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">节点名称</label>
                  <input 
                    type="text" 
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                    value={selectedNode.label}
                    onChange={(e) => updateNode(selectedNode.id, { label: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {selectedNode.parentId && nodes[selectedNode.parentId].type === NodeType.CHANCE && (
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">分支概率 (%)</label>
                      <input 
                        type="number" 
                        step="0.01"
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                        value={selectedNode.probability || 0}
                        onChange={(e) => updateNode(selectedNode.id, { probability: parseFloat(e.target.value) })}
                      />
                    </div>
                  )}
                  {selectedNode.type === NodeType.TERMINAL && (
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">收益值 (Value)</label>
                      <input 
                        type="number" 
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-blue-500/20 outline-none"
                        value={selectedNode.value || 0}
                        onChange={(e) => updateNode(selectedNode.id, { value: parseFloat(e.target.value) })}
                      />
                    </div>
                  )}
                  {selectedNode.type === NodeType.CHANCE && (
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">实施成本 (Cost)</label>
                      <input 
                        type="number" 
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-blue-500/20 outline-none"
                        value={selectedNode.cost || 0}
                        onChange={(e) => updateNode(selectedNode.id, { cost: parseFloat(e.target.value) })}
                      />
                    </div>
                  )}
                </div>

                <div className="pt-4 space-y-2">
                  {selectedNode.type !== NodeType.TERMINAL && (
                    <>
                      <button 
                        onClick={() => addNode(selectedNode.id, NodeType.CHANCE)}
                        className="w-full flex items-center justify-center gap-2 py-2 border border-blue-100 text-blue-600 rounded-lg text-xs font-semibold hover:bg-blue-50 transition-colors"
                      >
                        <Plus className="w-3 h-3" /> 添加机会节点
                      </button>
                      <button 
                        onClick={() => addNode(selectedNode.id, NodeType.TERMINAL)}
                        className="w-full flex items-center justify-center gap-2 py-2 border border-slate-100 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors"
                      >
                        <Plus className="w-3 h-3" /> 添加结果端点
                      </button>
                    </>
                  )}
                  {selectedNode.id !== 'root' && (
                    <button 
                      onClick={() => deleteNode(selectedNode.id)}
                      className="w-full flex items-center justify-center gap-2 py-2 text-rose-500 hover:bg-rose-50 rounded-lg text-xs font-semibold transition-colors mt-2"
                    >
                      <Trash2 className="w-3 h-3" /> 删除当前节点
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-12 px-4 border-2 border-dashed border-slate-100 rounded-2xl text-center">
                <MousePointer2 className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                <p className="text-xs text-slate-400 leading-relaxed font-medium">在画布中选中任何节点<br/>开始编辑属性</p>
              </div>
            )}
          </div>

          <div className="mt-auto pt-6 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">分析控制</h3>
            <div className="space-y-3">
              {!isSolved ? (
                <>
                  <button 
                    onClick={() => handleSolve(false)}
                    className="w-full flex items-center justify-center space-x-2 py-2.5 border border-blue-600 text-blue-600 rounded-md text-sm font-medium hover:bg-blue-50 transition-all active:scale-[0.98]"
                  >
                    <ChevronRight className="w-4 h-4" /> <span>逐步求解</span>
                  </button>
                  <button 
                    onClick={() => handleSolve(true)}
                    className="w-full flex items-center justify-center space-x-2 py-2.5 bg-blue-600 text-white rounded-md text-sm font-medium shadow-md shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-[0.98]"
                  >
                    <Play className="w-4 h-4" /> <span>自动求解 (EMV)</span>
                  </button>
                </>
              ) : (
                <>
                  {currentStep < logs.length - 1 && (
                    <button 
                      onClick={handleNextStep}
                      className="w-full flex items-center justify-center space-x-2 py-2.5 bg-emerald-600 text-white rounded-md text-sm font-medium shadow-md shadow-emerald-500/20 hover:bg-emerald-700 transition-all active:scale-[0.98]"
                    >
                      <ChevronRight className="w-4 h-4" /> <span>下一步计算</span>
                    </button>
                  )}
                  <button 
                    onClick={handleReset}
                    className="w-full flex items-center justify-center space-x-2 py-2.5 border border-slate-200 text-slate-600 rounded-md text-sm font-medium hover:bg-slate-50 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" /> <span>清空计算结果</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </aside>

        {/* 画布区域 */}
        <main 
          ref={containerRef}
          className="flex-1 relative bg-slate-50 overflow-hidden cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
          onWheel={(e) => handleWheel(e.nativeEvent)}
        >
          {/* 网格背景 */}
          <div className="absolute inset-0 pointer-events-none opacity-40" style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>

          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              transformOrigin: '0 0',
              transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
              transition: 'transform 0.1s ease-out'
            }}
          >
            <svg className="w-full h-full overflow-visible pointer-events-auto">
              <g>
                {(Object.values(nodes) as TreeNode[]).map(node => node.children.map(childId => {
                  const start = layout[node.id];
                  const end = layout[childId];
                  if (!start || !end) return null;

                  // 只有当节点已经被计算后，才显示最佳路径高亮
                  const isCalculated = isNodeCalculated(node.id);
                  const isBestPath = isCalculated && solvedResults?.[node.id]?.bestOptionId === childId;

                  return (
                    <g key={`${node.id}-${childId}`}>
                      <path
                        d={`M ${start.x} ${start.y} L ${end.x} ${end.y}`}
                        stroke={isBestPath ? '#2563eb' : '#cbd5e1'}
                        strokeWidth={isBestPath ? 3.5 : 1.5}
                        fill="none"
                        className="transition-all duration-500"
                        strokeDasharray={isBestPath ? 'none' : '4 2'}
                      />
                      {nodes[childId].probability !== undefined && (
                        <g transform={`translate(${(start.x + end.x) / 2}, ${(start.y + end.y) / 2 - 12})`}>
                          <rect x="-24" y="-10" width="48" height="20" rx="4" fill="white" stroke="#e2e8f0" strokeWidth="1" />
                          <text className="text-[10px] font-mono font-bold" textAnchor="middle" dominantBaseline="middle" fill="#64748b">
                            P={nodes[childId].probability}
                          </text>
                        </g>
                      )}
                    </g>
                  );
                }))}
              </g>

              {(Object.values(nodes) as TreeNode[]).map(node => {
                const pos = layout[node.id];
                const isSelected = selectedNodeId === node.id;
                const isCalculated = isNodeCalculated(node.id);
                const isCalculating = isSolved && currentStep >= 0 && logs[currentStep]?.nodeId === node.id;
                const expectedValue = isCalculated ? solvedResults?.[node.id]?.expectedValue : undefined;
                
                const skins = {
                  [NodeType.DECISION]: { bg: '#ffffff', stroke: '#2563eb', accent: '#2563eb', label: 'DECISION' },
                  [NodeType.CHANCE]: { bg: '#ffffff', stroke: '#f59e0b', accent: '#f59e0b', label: 'CHANCE' },
                  [NodeType.TERMINAL]: { bg: '#ffffff', stroke: '#cbd5e1', accent: '#10b981', label: 'LEAF' },
                };

                const skin = skins[node.type];

                return (
                  <g 
                    key={node.id} 
                    transform={`translate(${pos.x}, ${pos.y})`}
                    onClick={(e) => { e.stopPropagation(); setSelectedNodeId(node.id); }}
                    className="cursor-pointer group"
                  >
                    <motion.g 
                      initial={false} 
                      animate={{ 
                        scale: isSelected || isCalculating ? 1.1 : 1,
                        filter: isCalculating ? 'drop-shadow(0 4px 12px rgba(37, 99, 235, 0.2))' : 'drop-shadow(0 2px 4px rgba(0,0,0,0.05))'
                      }}
                    >
                      {node.type === NodeType.DECISION && (
                        <rect x="-50" y="-35" width="100" height="70" rx="4" fill={skin.bg} stroke={isCalculating ? '#2563eb' : skin.stroke} strokeWidth={isSelected || isCalculating ? 2.5 : 1.5} />
                      )}
                      {node.type === NodeType.CHANCE && (
                        <circle r="40" fill={skin.bg} stroke={isCalculating ? '#f59e0b' : skin.stroke} strokeWidth={isSelected || isCalculating ? 2.5 : 1.5} />
                      )}
                      {node.type === NodeType.CHANCE && node.cost > 0 && (
                        <text y="28" className="text-[10px] font-bold fill-rose-500" textAnchor="middle">
                          Cost: {node.cost}
                        </text>
                      )}
                      {node.type === NodeType.TERMINAL && (
                        <polygon points="0,-40 40,30 -40,30" fill={skin.bg} stroke={skin.stroke} strokeWidth={isSelected ? 2.5 : 1.5} />
                      )}

                      <text y={node.type === NodeType.TERMINAL ? 5 : 2} className="text-[12px] font-medium fill-slate-800" textAnchor="middle" dominantBaseline="middle">
                        {node.label}
                      </text>
                      <text y={node.type === NodeType.TERMINAL ? -10 : -20} className="text-[8px] font-bold fill-slate-400" textAnchor="middle">
                        {skin.label}
                      </text>

                      {isSolved && isCalculated && expectedValue !== undefined && (
                        <g transform="translate(0, 50)">
                          <rect x="-40" y="-11" width="80" height="22" rx="4" fill={node.type === NodeType.DECISION ? '#2563eb' : (node.type === NodeType.CHANCE ? '#f59e0b' : '#334155')} />
                          <text y="0" className="text-[10px] font-mono font-bold fill-white" textAnchor="middle" dominantBaseline="middle">
                            {expectedValue.toFixed(1)}
                          </text>
                        </g>
                      )}

                      {node.type === NodeType.TERMINAL && (
                        <text y="26" className="text-[10px] font-bold fill-emerald-600" textAnchor="middle">
                         {node.value >= 0 ? `+${node.value}` : node.value}
                        </text>
                      )}
                    </motion.g>
                  </g>
                );
              })}
            </svg>
          </div>

        </main>

        {/* 右侧求解日志栏 */}
        <aside className="w-80 bg-white border-l border-slate-200 flex flex-col z-20">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-sm font-bold text-slate-700 flex items-center space-x-2 font-sans tracking-tight">
              <span className={`w-2.5 h-2.5 rounded-full ${isSolved ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`}></span>
              <span>求解计算分析 (EMV)</span>
            </h3>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {isSolved && logs.length > 0 ? (
              <div className="space-y-6">
                <section>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-4">推导过程日志</div>
                  <div className="space-y-3">
                    {logs.slice(0, currentStep + 1).map((log, i) => (
                      <motion.div 
                        key={i}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                        className={`p-3 rounded-lg border-l-4 transition-all cursor-pointer ${
                          currentStep === i 
                            ? 'bg-blue-50 border-blue-500 shadow-sm' 
                            : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                        }`}
                        onClick={() => setCurrentStep(i)}
                      >
                        <p className="text-[10px] font-mono text-slate-400 mb-1">Step {i + 1}: {nodes[log.nodeId]?.label}</p>
                        <p className="text-xs font-semibold text-slate-800 leading-tight mb-2 tracking-tight">{log.msg}</p>
                        <div className="bg-white/60 p-1.5 rounded border border-slate-100 mb-2">
                           <p className="text-[11px] font-mono text-slate-500 break-all">{log.formula}</p>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">RESULT</span>
                          <span className={`text-sm font-bold ${currentStep === i ? 'text-blue-600' : 'text-slate-700'}`}>{log.result.toFixed(2)}</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </section>

                <AnimatePresence>
                  {isSolved && currentStep === logs.length - 1 && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl shadow-sm"
                    >
                      <p className="text-[10px] font-bold text-indigo-800 mb-2 uppercase tracking-wider">最佳决策建议</p>
                      <p className="text-xs text-indigo-900 leading-relaxed font-medium">
                        基于期望货币价值分析，根节点的最佳方案是 <span className="underline decoration-indigo-300 decoration-2">{(Object.values(nodes) as TreeNode[]).find(n => n.id === solvedResults?.['root']?.bestOptionId)?.label || '等待计算'}</span>，对应的最终期望价值为 <span className="font-bold">{solvedResults?.['root']?.expectedValue?.toFixed(1) || '0'}</span>。
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-40 px-6">
                <Calculator className="w-12 h-12 text-slate-300 mb-4" />
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">等待模型求解</p>
                <p className="text-[11px] text-slate-400 leading-relaxed">点击左侧“运行 EMV 求解”按钮，开始通过逆推归纳法分析最佳路径。</p>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-slate-100 bg-slate-50/30">
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <span>节点数量: {Object.keys(nodes).length}</span>
              <span>实时分析已就绪</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
    </PasswordGate>
  );
}
