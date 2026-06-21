/**
 * COLOR EDITOR COMPONENT
 * ──────────────────────
 * Add this component to your Admin.jsx file.
 * 
 * STEP 1: Paste the ColorEditor component below into Admin.jsx
 *         (anywhere before the ProductModal function)
 *
 * STEP 2: In the EMPTY constant, add:
 *         colors: [],
 *
 * STEP 3: In the form initialisation inside ProductModal (where product exists),
 *         add this line inside the return object:
 *         colors: product.colors || [],
 *
 * STEP 4: In the handleSave payload, add:
 *         colors: form.colors,
 *
 * STEP 5: Inside the ProductModal JSX, add <ColorEditor /> just before
 *         the featured checkbox:
 *
 *         <ColorEditor
 *           colors={form.colors}
 *           onChange={colors => set('colors', colors)}
 *         />
 */

// ─── Paste this component into Admin.jsx ─────────────────────────────────────

function ColorEditor({ colors = [], onChange }) {
  const [newHex,   setNewHex]   = React.useState('#000000');
  const [newName,  setNewName]  = React.useState('');
  const [showPick, setShowPick] = React.useState(false);

  const PRESETS = [
    { hex: '#000000', name: 'Black'      },
    { hex: '#ffffff', name: 'White'      },
    { hex: '#8B4513', name: 'Brown'      },
    { hex: '#c8a96b', name: 'Nude'       },
    { hex: '#d4a5a5', name: 'Blush'      },
    { hex: '#212836', name: 'Navy'       },
    { hex: '#1e805f', name: 'Green'      },
    { hex: '#e05252', name: 'Red'        },
    { hex: '#c9a840', name: 'Gold'       },
    { hex: '#a0a0a0', name: 'Silver'     },
    { hex: '#d4e8e0', name: 'Sage'       },
    { hex: '#f5e6ca', name: 'Cream'      },
  ];

  const addColor = (hex, name) => {
    if (colors.find(c => c.hex === hex)) return; // no duplicates
    onChange([...colors, { hex, name: name || hex }]);
    setNewHex('#000000');
    setNewName('');
    setShowPick(false);
  };

  const removeColor = (hex) => {
    onChange(colors.filter(c => c.hex !== hex));
  };

  const inp = "px-3 py-2 border border-[#ede9e2] rounded-xl text-sm outline-none focus:border-[#1e805f] transition-colors bg-white";

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-[11px] font-bold uppercase tracking-wide text-[#999]">
          Colors (optional)
        </label>
        <button
          type="button"
          onClick={() => setShowPick(p => !p)}
          className="text-xs font-medium px-3 py-1 rounded-full border transition-colors"
          style={{
            borderColor: showPick ? 'var(--teal)' : 'var(--border)',
            color:       showPick ? 'var(--teal)' : 'var(--ink-soft)',
            background:  showPick ? 'var(--teal-pale)' : 'transparent',
          }}
        >
          {showPick ? '− Close' : '+ Add color'}
        </button>
      </div>

      {/* Current colors */}
      {colors.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {colors.map(c => (
            <div key={c.hex}
                 className="flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-full border text-xs"
                 style={{ borderColor: 'var(--border)' }}>
              <div className="w-4 h-4 rounded-full border border-black/10 flex-shrink-0"
                   style={{ background: c.hex }} />
              <span style={{ color: 'var(--ink)' }}>{c.name}</span>
              <button type="button" onClick={() => removeColor(c.hex)}
                      className="ml-0.5 text-[#ccc] hover:text-[#e05252] transition-colors leading-none">
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {colors.length === 0 && !showPick && (
        <p className="text-xs mb-3" style={{ color: 'var(--ink-soft)' }}>
          No colors added — color swatches won't appear on the product card.
        </p>
      )}

      {/* Color picker panel */}
      {showPick && (
        <div className="border rounded-2xl p-4 mb-3" style={{ borderColor: 'var(--border)', background: 'var(--bone)' }}>
          {/* Presets */}
          <div className="text-[10px] font-bold uppercase tracking-wide mb-2"
               style={{ color: 'var(--ink-soft)' }}>
            Quick select
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            {PRESETS.map(p => (
              <button key={p.hex} type="button" title={p.name}
                      onClick={() => addColor(p.hex, p.name)}
                      disabled={!!colors.find(c => c.hex === p.hex)}
                      className="w-7 h-7 rounded-full border-2 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                      style={{
                        background:  p.hex,
                        borderColor: 'rgba(0,0,0,.1)',
                        boxShadow:   p.hex === '#ffffff' ? 'inset 0 0 0 1px #ddd' : 'none',
                      }} />
            ))}
          </div>

          {/* Custom color */}
          <div className="text-[10px] font-bold uppercase tracking-wide mb-2"
               style={{ color: 'var(--ink-soft)' }}>
            Custom color
          </div>
          <div className="flex gap-2 items-center">
            <input type="color" value={newHex} onChange={e => setNewHex(e.target.value)}
                   className="w-10 h-10 rounded-xl border border-[#ede9e2] cursor-pointer p-0.5" />
            <input type="text" value={newName} onChange={e => setNewName(e.target.value)}
                   placeholder="Color name e.g. Ivory"
                   className={inp + ' flex-1'} />
            <button type="button"
                    onClick={() => addColor(newHex, newName || newHex)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-white transition-colors"
                    style={{ background: 'var(--teal)' }}>
              Add
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
