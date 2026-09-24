import { useState } from 'react';

const PieChart = ({ title, data, headerColor = '#6366f1', unit = 'Total', onSelect, onReset }) => {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [isCardHovered, setIsCardHovered] = useState(false);

  const total = data.reduce((sum, item) => sum + Number(item.value || 0), 0);

  const colors = [
    '#6366f1', // Indigo
    '#f97316', // Orange
    '#ec4899', // Pink
    '#10b981', // Emerald
    '#06b6d4', // Cyan
    '#8b5cf6', // Violet
    '#f43f5e', // Rose
    '#eab308', // Yellow
  ];

  if (total === 0) {
    return (
      <div 
        className="card shadow-sm border-0 p-3 mb-3 rounded-3 text-center text-muted"
        style={{
          borderTop: `4px solid ${headerColor}`,
          background: 'linear-gradient(145deg, #ffffff, #fcfdff)',
        }}
      >
        <h6 className="fw-bold mb-3">{title}</h6>
        <div style={{ height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          No data available
        </div>
      </div>
    );
  }

  let accumulatedPercent = 0;
  const gradientSlices = [];
  
  data.forEach((item, index) => {
    const val = Number(item.value || 0);
    if (val > 0) {
      const percent = (val / total) * 100;
      const start = accumulatedPercent;
      accumulatedPercent += percent;
      const color = colors[index % colors.length];
      gradientSlices.push(`${color} ${start}% ${accumulatedPercent}%`);
    }
  });

  const gradientBackground = gradientSlices.length > 0 
    ? `conic-gradient(${gradientSlices.join(', ')}, #f1f3f9 ${accumulatedPercent}% 100%)`
    : `conic-gradient(#f1f3f9 0% 100%)`;

  return (
    <div 
      className="card shadow-sm border-0 p-3 mb-3 rounded-3"
      onClick={() => {
        if (onReset) onReset();
      }}
      title={onReset ? "Click empty area to reset filter" : undefined}
      style={{
        background: 'linear-gradient(145deg, #ffffff, #fcfdff)',
        borderTop: `4px solid ${headerColor}`,
        boxShadow: isCardHovered 
          ? `0 8px 30px rgba(0, 0, 0, 0.08)` 
          : `0 4px 16px rgba(0, 0, 0, 0.04)`,
        transform: isCardHovered ? 'translateY(-4px)' : 'translateY(0)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'pointer'
      }}
      onMouseEnter={() => setIsCardHovered(true)}
      onMouseLeave={() => setIsCardHovered(false)}
    >
      <h6 className="fw-bold mb-3 text-muted text-center" style={{ fontSize: '14px' }}>{title}</h6>
      
      {/* Dynamic CSS Donut Chart */}
      <div className="d-flex justify-content-center mb-3" style={{ position: 'relative' }}>
        <div
          style={{
            width: '130px',
            height: '130px',
            borderRadius: '50%',
            background: gradientBackground,
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
            transition: 'transform 0.3s ease',
          }}
        >
          {/* Inner cutout circle to make it a donut */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              if (onReset) onReset();
            }}
            title={onReset ? `Clear ${unit} filter` : undefined}
            style={{
              width: '102px',
              height: '102px',
              borderRadius: '50%',
              background: '#ffffff',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.04)',
              cursor: onReset ? 'pointer' : 'default',
            }}
          >
            {unit === 'Total' ? (
              <span className="fw-bold text-dark" style={{ fontSize: '11px' }}>{total} Total</span>
            ) : (
              <>
                <span className="fw-bold text-dark" style={{ fontSize: '16px', fontWeight: '800', lineHeight: '1.1' }}>{data.length}</span>
                <span className="text-muted fw-semibold" style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{unit}</span>
              </>
            )}
          </div>
        </div>

        {/* Interactive Floating Tooltip */}
        {hoveredIndex !== null && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: 'rgba(33, 37, 41, 0.95)',
              color: '#fff',
              padding: '6px 10px',
              borderRadius: '6px',
              fontSize: '11px',
              pointerEvents: 'none',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              textAlign: 'center',
              zIndex: 10,
              width: '110px'
            }}
          >
            <div className="fw-bold text-truncate">{data[hoveredIndex].label}</div>
            <div>
              {data[hoveredIndex].value} ({Math.round((Number(data[hoveredIndex].value || 0) / total) * 100)}%)
            </div>
          </div>
        )}
      </div>

      {/* Legend Block */}
      <div style={{ maxHeight: '120px', overflowY: 'auto', paddingRight: '4px' }}>
        <ul className="list-unstyled mb-0 d-flex flex-column gap-1">
          {data.map((item, index) => {
            const color = colors[index % colors.length];
            const percent = Math.round((Number(item.value || 0) / total) * 100);
            const isHovered = hoveredIndex === index;

            return (
              <li
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  if (onSelect) onSelect(item.label);
                }}
                className="d-flex align-items-center justify-content-between p-1 rounded"
                title={onSelect ? `Filter by ${item.label}` : undefined}
                style={{
                  background: isHovered ? '#f4f6ff' : 'transparent',
                  transition: 'background 0.2s',
                  fontSize: '11px',
                  cursor: 'pointer',
                }}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <div className="d-flex align-items-center gap-2">
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: color,
                    }}
                  />
                  <span className="text-muted text-truncate" style={{ maxWidth: '80px' }} title={item.label}>
                    {item.label}
                  </span>
                </div>
                <div className="fw-bold text-dark">
                  {item.value} <span className="text-muted fw-normal" style={{ fontSize: '9px' }}>({percent}%)</span>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default PieChart;
