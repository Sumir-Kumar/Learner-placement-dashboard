import { useState } from 'react';

const TRUNCATE_LEN = 80;

export default function ExpandableText({ label, value, className = '' }) {
  const [expanded, setExpanded] = useState(false);
  const str = value != null && typeof value === 'string' ? value.trim() : '';
  const isEmpty = str === '';
  const truncated = str.length > TRUNCATE_LEN && !expanded;
  const display = truncated ? str.slice(0, TRUNCATE_LEN) : str;
  const showToggle = str.length > TRUNCATE_LEN;

  return (
    <li className={`text-sm ${className}`}>
      <b className="text-gray-700 shrink-0">{label}:</b>
      <span className="text-gray-900">
        {isEmpty ? '–' : display}
        {truncated && ' '}
        {showToggle && (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="ml-1 text-blue-600 hover:underline focus:outline-none"
          >
            Show more
          </button>
        )}
      </span>
      {expanded && showToggle && (
        <div className="mt-2 rounded-lg border border-gray-100 bg-gray-50 p-3 text-gray-900 text-sm">
          {str}
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="mt-2 block text-blue-600 hover:underline focus:outline-none"
          >
            Show less
          </button>
        </div>
      )}
    </li>
  );
}
