import { useMemo, useState } from 'react';

export default function ImageLightbox({ images, startIndex, onClose }) {
  const [index, setIndex] = useState(startIndex);
  const current = images[index];

  const title = useMemo(() => {
    if (!current) return '';
    return current.original_filename || 'Photo';
  }, [current]);

  if (!current) {
    return null;
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="lightbox" onClick={(event) => event.stopPropagation()}>
        <button className="btn btn-ghost" onClick={onClose}>Close</button>
        <img src={current.displayUrl} alt={title} className="lightbox-image" />
        <div className="row between center mt-sm">
          <button className="btn btn-ghost" disabled={index <= 0} onClick={() => setIndex((value) => value - 1)}>
            Previous
          </button>
          <span>{index + 1} / {images.length}</span>
          <button
            className="btn btn-ghost"
            disabled={index >= images.length - 1}
            onClick={() => setIndex((value) => value + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
