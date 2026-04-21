import React from "react";

function ExtractForm({ embedMethod, setEmbedMethod, lsbType, setLsbType }) {
    const [imageFile, setImageFile] = React.useState(null);
    const [previewUrl, setPreviewUrl] = React.useState(null);
    const [extractedMessage, setExtractedMessage] = React.useState("");
    const [loading, setLoading] = React.useState(false);
    const [isDragging, setIsDragging] = React.useState(false);
    const [secretKey, setSecretKey] = React.useState("");
    const [progress, setProgress] = React.useState(0);
    const [showPassword, setShowPassword] = React.useState(false);
    const [ validImage, setValidImage] = React.useState(true);
    

    const onImageUpload = async (e) => {
        const file = e.target ? e.target.files[0] : e;

        try {
            const formData = new FormData();
            formData.append("image", file);
            const response = await fetch("http://localhost:5000/validate-image", {
                method: "POST",
                body: formData,
            });
            console.log("Validation response status:", response.status);

            if (!response.ok) {
                const errorData = await response.json();
                console.error("Response error:", errorData);
                alert(`Image validation failed: ${errorData.message || "Invalid image."}`);
                setValidImage(false);
                return;
            }
        } catch (error) {
            console.error("Error validating image:", error);
        }

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
        
        if (lsbType === "random" && embedMethod === "lsb" && !secretKey) {
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

        try {
            const endpoint = embedMethod === "lsb" ? "extract/lsb" : "extract/dct";
            const response = await fetch(`http://localhost:5000/${endpoint}`, {
                method: "POST",
                body: formData,
            });

            clearInterval(interval); 
            setProgress(100);

            if (!response.ok) {
                const errorData = await response.json();
                console.error("Response error:", errorData);
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

            <div className="label">Extraction Method</div>
            <div className="button">
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
                    <div>
                        <label className="sub-label">LSB Mode</label>
                        <div className="button">
                            <button className={lsbType === "sequential" ? "active" : ""} onClick={() => setLsbType("sequential")}>Sequential</button>
                            <button className={lsbType === "random" ? "active" : ""} onClick={() => setLsbType("random")}>Random</button>
                        </div>
                    </div>
            ) : (
                <div>
                    <p className="label" style={{margin: 0, opacity: 0.7}}></p>
                </div>
            )}
            <div style={{height: '20px'}}></div>
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
                        <div style={{fontSize: '1.5rem', marginBottom: '8px'}}>📁</div>
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
                <div className="input-box">
                    <label>Secret Key</label>
                    <div className="password-input-wrapper">
                        <div className="input-with-icon">
                            <input
                                className="form-control"
                                type={showPassword ? "text" : "password"}
                                value={secretKey}
                                onChange={(e) => setSecretKey(e.target.value)}
                                placeholder="Enter the key used to hide the message"
                            />
                            <button 
                                    type="button"
                                    className={`eye-toggle-button ${showPassword ? 'active' : ''}`}
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label={showPassword ? "Hide password" : "Show password"}>
                                        👁
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <div style={{height: '20px'}}></div>

            <button className="submit-button" onClick={handleExtract} disabled={loading || !imageFile || !validImage||(embedMethod === "lsb" && lsbType === "random" && !secretKey)}>
                {loading ? "Extracting..." : "Extract Message"}
            </button>

            {extractedMessage && (
                <div className="stegged-result mt-4">
                    <div className="input-box">
                        <label>Extracted Message</label>
                        <div className="extracted-result-box" >
                            {extractedMessage}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ExtractForm;