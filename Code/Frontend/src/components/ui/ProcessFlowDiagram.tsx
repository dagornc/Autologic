import React, { useEffect } from 'react';
import {
    ReactFlow,
    useNodesState,
    useEdgesState,
    Position,
    type Node,
    type Edge,
    Handle,
    type NodeProps,
    Background,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
    Search,
    Brain,
    Wrench,
    Layout,
    ShieldCheck,
    Zap,
    Scale,
    FileText,
    CheckCircle,
    Flag,
    Loader2
} from 'lucide-react';
import type { LoadingStage } from '../../types';

// --- Custom Node Implementation ---

type NodeStatus = 'pending' | 'active' | 'completed' | 'error';

interface CustomNodeData extends Record<string, unknown> {
    label: string;
    icon: React.ElementType;
    status: NodeStatus;
    type?: 'start' | 'process' | 'decision' | 'end';
}

const CustomNode = ({ id, data }: NodeProps<Node<CustomNodeData>>) => {
    const { label, icon: Icon, status, type = 'process' } = data;

    // Style variants based on status
    const getStatusStyles = () => {
        switch (status) {
            case 'active':
                return 'border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.6)] bg-indigo-900/40 text-white animate-pulse ring-2 ring-indigo-400/30';
            case 'completed':
                return 'border-emerald-500/50 bg-emerald-900/20 text-emerald-100 shadow-[0_0_10px_rgba(16,185,129,0.2)]';
            case 'error':
                return 'border-red-500 bg-red-900/20 text-red-100';
            default: // pending
                return 'border-white/10 bg-white/5 text-zinc-500 dark:text-zinc-400';
        }
    };

    return (
        <div className={`
            relative px-5 py-3 min-w-[160px] flex flex-col items-center justify-center gap-2
            backdrop-blur-md border transition-all duration-500
            ${getStatusStyles()}
            ${type === 'decision' ? 'border-double border-4 rounded-lg' : 'rounded-xl border-solid'}
        `}>
            {/* Horizontal Flow Handles: Input Left, Output Right */}
            <Handle type="target" position={Position.Left} className="!bg-white/20 !border-0" />
            <Handle type="source" position={Position.Right} className="!bg-white/20 !border-0" />

            {/* Special Handles for loops (Top for backward loops) */}
            {type === 'decision' && (
                <Handle type="source" position={Position.Top} id="top" className="!bg-white/20 !border-0" />
            )}

            {/* Loop Targets (Always render for nodes 3 and 7 to avoid React Flow warnings) */}
            {(id === '3' || id === '7') && (
                <Handle type="target" position={Position.Top} id="loop-target" className="!bg-transparent !border-0" />
            )}

            <div className="flex items-center gap-2 z-10">
                {status === 'active' ? (
                    <Loader2 className="w-6 h-6 animate-spin text-indigo-300" />
                ) : status === 'completed' ? (
                    <CheckCircle className="w-6 h-6 text-emerald-400" />
                ) : (
                    <Icon className="w-6 h-6 opacity-70" />
                )}
                <span className="text-xs font-bold tracking-wide uppercase">{label}</span>
            </div>

            {/* Status Badge for Decision */}
            {type === 'decision' && status === 'active' && (
                <div className="absolute -top-2 -right-2 bg-indigo-600 rounded-full p-0.5 shadow-lg">
                    <Scale className="w-2.5 h-2.5 text-white" />
                </div>
            )}
        </div>
    );
};

// --- Diagram Definition ---

const nodeTypes = {
    custom: CustomNode,
};

interface ProcessFlowDiagramProps {
    currentStage: LoadingStage;
}

export const ProcessFlowDiagram: React.FC<ProcessFlowDiagramProps> = ({ currentStage }) => {

    const getActiveNodeId = (stage: string): string => {
        if (!stage) return 'T';
        if (stage.includes('Analyzing')) return '0';
        if (stage.includes('Selecting')) return '1';
        if (stage.includes('Adapting')) return '2';
        if (stage.includes('Structuring')) return '3';
        if (stage.includes('Verifying')) return '4';
        if (stage.includes('Executing')) return '5';
        if (stage.includes('Critic')) return '6';
        if (stage.includes('Synthesizing')) return '7';
        if (stage.includes('Auditing')) return '8';
        if (stage.includes('Final')) return 'F';
        return 'T';
    };

    const activeId = getActiveNodeId(currentStage);

    // Horizontal Layout Config
    const Y_MAIN = 150;
    const X_START = 0;
    const X_GAP = 240;

    const initialNodes: Node<CustomNodeData>[] = [
        { id: 'T', position: { x: X_START, y: Y_MAIN }, data: { label: 'Task Input', icon: FileText, status: 'pending', type: 'start' }, type: 'custom' },
        { id: '0', position: { x: X_START + X_GAP * 1, y: Y_MAIN }, data: { label: 'Analyse', icon: Search, status: 'pending' }, type: 'custom' },
        { id: '1', position: { x: X_START + X_GAP * 2, y: Y_MAIN }, data: { label: 'Brain Select', icon: Brain, status: 'pending' }, type: 'custom' },
        { id: '2', position: { x: X_START + X_GAP * 3, y: Y_MAIN }, data: { label: 'Adapt', icon: Wrench, status: 'pending' }, type: 'custom' },
        { id: '3', position: { x: X_START + X_GAP * 4, y: Y_MAIN }, data: { label: 'Structure', icon: Layout, status: 'pending' }, type: 'custom' },
        { id: '4', position: { x: X_START + X_GAP * 5, y: Y_MAIN }, data: { label: 'Verify Plan', icon: ShieldCheck, status: 'pending', type: 'decision' }, type: 'custom' },
        { id: '5', position: { x: X_START + X_GAP * 6, y: Y_MAIN }, data: { label: 'Execute', icon: Zap, status: 'pending' }, type: 'custom' },
        { id: '6', position: { x: X_START + X_GAP * 7, y: Y_MAIN }, data: { label: 'H2 Critic', icon: Scale, status: 'pending', type: 'decision' }, type: 'custom' },
        { id: '7', position: { x: X_START + X_GAP * 8, y: Y_MAIN }, data: { label: 'Synthesis', icon: FileText, status: 'pending' }, type: 'custom' },
        { id: '8', position: { x: X_START + X_GAP * 9, y: Y_MAIN }, data: { label: 'Audit', icon: ShieldCheck, status: 'pending', type: 'decision' }, type: 'custom' },
        { id: 'F', position: { x: X_START + X_GAP * 10, y: Y_MAIN }, data: { label: 'Final', icon: Flag, status: 'pending', type: 'end' }, type: 'custom' },
    ];

    const initialEdges: Edge[] = [
        { id: 'eT-0', source: 'T', target: '0', animated: true },
        { id: 'e0-1', source: '0', target: '1', animated: true },
        { id: 'e1-2', source: '1', target: '2', animated: true },
        { id: 'e2-3', source: '2', target: '3', animated: true },
        { id: 'e3-4', source: '3', target: '4', animated: true },

        // Structure Loop (Verify KO -> Structure)
        {
            id: 'e4-3-ko',
            source: '4',
            target: '3',
            sourceHandle: 'top',
            targetHandle: 'loop-target',
            label: 'KO',
            type: 'smoothstep',
            style: { stroke: '#ef4444', strokeDasharray: '5,5' }
        },
        // Verify OK
        { id: 'e4-5-ok', source: '4', target: '5', label: 'OK', animated: true, style: { stroke: '#10b981' } },

        { id: 'e5-6', source: '5', target: '6', animated: true },

        // Critic Loop (Rejected -> Structure) - Back to 3 (Long jump)
        {
            id: 'e6-3-reject',
            source: '6',
            target: '3',
            sourceHandle: 'top',
            targetHandle: 'loop-target',
            label: 'Rejeté',
            type: 'smoothstep',
            // pathOptions removed
            style: { stroke: '#f43f5e', strokeDasharray: '5,5' },
            labelStyle: { fill: '#f43f5e', fontWeight: 700 }
        },

        // Critic Validated
        { id: 'e6-7-ok', source: '6', target: '7', label: 'Validé', animated: true, style: { stroke: '#10b981' } },

        { id: 'e7-8', source: '7', target: '8', animated: true },

        // Audit Loop (Fail -> Synthesis)
        {
            id: 'e8-7-fail',
            source: '8',
            target: '7',
            sourceHandle: 'top',
            targetHandle: 'loop-target',
            label: 'Echec',
            type: 'smoothstep',
            style: { stroke: '#ca8a04', strokeDasharray: '5,5' }
        },

        // Audit Success
        { id: 'e8-F', source: '8', target: 'F', label: 'Succès', animated: true, style: { stroke: '#10b981', strokeWidth: 2 } },
    ];

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, , onEdgesChange] = useEdgesState(initialEdges); // setEdges removed as unused

    useEffect(() => {
        setNodes((nds) => nds.map((node) => {
            const sequence = ['T', '0', '1', '2', '3', '4', '5', '6', '7', '8', 'F'];
            const activeIndex = sequence.indexOf(activeId);
            const nodeIndex = sequence.indexOf(node.id);

            let newStatus: NodeStatus = 'pending';

            if (nodeIndex < activeIndex && activeIndex !== -1) {
                newStatus = 'completed';
            } else if (node.id === activeId) {
                newStatus = 'active';
            }

            return {
                ...node,
                data: {
                    ...node.data,
                    status: newStatus
                }
            };
        }));
    }, [activeId, setNodes]);

    return (
        <div style={{ width: '100%', height: '150px' }} className="rounded-2xl overflow-hidden border border-white/10 bg-black/5">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                fitView
                attributionPosition="bottom-right"
                nodesDraggable={false}
                zoomOnScroll={false}
                panOnDrag={false}
                proOptions={{ hideAttribution: true }}
            >
                <Background color="rgba(99, 102, 241, 0.1)" gap={20} />
            </ReactFlow>
        </div>
    );
};
