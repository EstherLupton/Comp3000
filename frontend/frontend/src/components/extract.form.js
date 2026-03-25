import React from "react";

function ExtractForm({ embedMethod, setEmbedMethod, lsbType, setLsbType }) {
    const [imageFile, setImageFile] = React.useState(null);
    const [previewUrl, setPreviewUrl] = React.useState(null);
    const [extractedMessage, setExtractedMessage] = React.useState("");
    const [loading, setLoading] = React.useState(false);
    const [isDragging, setIsDragging] = React.useState(false);
    const [secretKey, setSecretKey] = React.useState("");
    const [progress, setProgress] = React.useState(0);
    const [dctOptions, setDctOptions] = React.useState(80);

    const onImageUpload = (e) => {
        const file = e.target ? e.target.files[0] : e;
        if (!file) return;
        setImageFile(file);
        setPreviewUrl(URL.createObjectURL(file));
        setExtractedMessage("");
        setProgress(0);
    };

    const handleExtract = async (e) => {
        e.preventDefault();
        if (!imageFile) {
            alert("Please select an image file first.");
            return;
        }
        
        if (lsbType === "random" && !secretKey) {
            alert("Please enter a secret key for random LSB.");
            return;
        }

        setLoading(true);
        setProgress(0);

        const interval = setInterval(() => {
        setProgress(prev => {
            if (prev >= 90) return prev; 
            return prev + 10;
        });
    }, 300);

        const formData = new FormData();
        formData.append("image", imageFile);
        formData.append("lsbType", lsbType);
        if (lsbType === "random") {
            formData.append("secretKey", secretKey);
        }
        if (embedMethod === "dct") {
            formData.append("dctOptions", dctOptions);
        }

        try {
            const endpoint = embedMethod === "lsb" ? "extract/lsb" : "extract/dct";
            const response = await fetch(`http://localhost:5000/${endpoint}`, {
                method: "POST",
                body: formData,
            });

            clearInterval(interval); 
            setProgress(100);

            if (!response.ok) {
                const errorText = await response.text();
                console.error("Response error:", errorText);
                alert("Failed to extract message. Status: " + response.status);
                return;
            }

            const data = await response.json();
            const message = data.extractedMessage || data.hiddenData || "";
            setExtractedMessage(message);
        } catch (error) {
            console.error("Error extracting message:", error);
            alert("Failed to extract message. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="extract-form">

            <div className="method-selector-label">Extraction Method</div>
            <div className="embed-extract-buttons">
                <button 
                    className={embedMethod === "lsb" ? "active" : ""} 
                    onClick={() => setEmbedMethod("lsb")}
                >
                    LSB (Spatial)
                </button>
                <button 
                    className={embedMethod === "dct" ? "active" : ""} 
                    onClick={() => setEmbedMethod("dct")}
                >
                    DCT (Frequency)
                </button>
            </div>

            {embedMethod === "lsb" ? (
                <div className="lsb-sub-settings animate-slide-down">
                    <label className="sub-label">LSB Mode</label>
                    <div className="lsb-mode-buttons">
                        <button className={lsbType === "sequential" ? "active" : ""} onClick={() => setLsbType("sequential")}>Sequential</button>
                        <button className={lsbType === "random" ? "active" : ""} onClick={() => setLsbType("random")}>Random</button>
                    </div>
                </div>
            ) : (
                <div className="dct-sub-settings animate-slide-down">
                    <p className="sub-label" style={{margin: 0, opacity: 0.7}}></p>
                </div>
            )}

            <div 
                className={`file-drop-area ${isDragging ? "dragging" : ""} ${previewUrl ? "has-file" : ""}`} 
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }} 
                onDragLeave={() => setIsDragging(false)} 
                onDrop={(e) => { e.preventDefault(); setIsDragging(false); onImageUpload(e.dataTransfer.files[0]); }}
                onClick={() => document.getElementById('hiddenFileInput').click()}
            >
                {previewUrl ? (
                    <div className="upload-preview">
                        <img src={previewUrl} alt="Preview" style={{maxHeight: '120px', borderRadius: '8px'}} />
                        <p style={{marginTop: '10px', fontSize: '0.8rem'}}>Change Source Image</p>
                    </div>
                ) : (
                
                    <>
                        <div style={{fontSize: '1.5rem', marginBottom: '8px'}}>🔍</div>
                        <p>Drop image to extract or <span>browse</span></p>
                    </>
                )}
                <input 
                    id="hiddenFileInput"
                    type="file" 
                    accept="image/*" 
                    onChange={onImageUpload} 
                    style={{display: 'none'}} 
                />
            </div>

            {lsbType === "random" && embedMethod === "lsb" && (
                <div className="glass-input-group mt-3 animate-slide-down">
                    <label>Secret Key</label>
                    <input
                        className="form-control"
                        type="password"
                        value={secretKey}
                        onChange={(e) => setSecretKey(e.target.value)}
                        placeholder="Enter the key used to hide the message"
                    />
                </div>
            )}

            <button className="glow-button mt-4 w-100" onClick={handleExtract} disabled={loading || !imageFile}>
                {loading ? "Extracting..." : "Extract Message"}
            </button>

            {extractedMessage && (
                <div className="stegged-result mt-4 animate-slide-down">
                    <div className="glass-input-group">
                        <label>Extracted Message</label>
                        <div className="extracted-result-box" style={{minHeight: '100px', background: 'rgba(0,0,0,0.2)'}}>
                            {extractedMessage}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ExtractForm;