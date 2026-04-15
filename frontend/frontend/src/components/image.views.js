function ImageViews({ original, stegged, difference }) {
  return (
    <div className="preview-grid">

      <div className="preview-column">
        <div className="sub-label">Image Data Map</div>

        {difference ? (
          <img src={difference} alt="Difference Map" className="preview-image" />
        ) : (
          <div className="empty-state">
            <div className="empty-icon">📷</div>
            <p>No Data Map</p>
          </div>
        )}
      </div>

      <div className="preview-column">
        <div className="sub-label">Original Image</div>

        {original ? (
          <img src={original} alt="Original" className="preview-image" />
        ) : (
          <div className="empty-state">
            <div className="empty-icon">📷</div>
            <p>No Image Selected</p>
          </div>
        )}
      </div>

      <div className="preview-column">
        <div className="sub-label">Stegged Image</div>

        {stegged ? (
          <img src={stegged} alt="Stegged" className="preview-image" />
        ) : (
          <div className="empty-state">
            <div className="empty-icon">📷</div>
            <p>No Stegged Image</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ImageViews;