import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Upload,
  Download,
  ArrowLeft,
  FileText,
  CheckCircle,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { Card } from '../../components/Card.jsx';
import { Button } from '../../components/Button.jsx';
import { Badge } from '../../components/Badge.jsx';
import { Checkbox } from '../../components/Checkbox.jsx';
import { ErrorAlert } from '../../components/ErrorAlert.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { api } from '../../lib/api.js';
import { getCountryName } from '../../../../shared/countries.js';

export function StaffImportPage() {
  const { isAdmin } = useAuth();
  const { showToast } = useToast();

  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [error, setError] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [sendInvites, setSendInvites] = useState(false);
  const [commitResult, setCommitResult] = useState(null);

  const fileInputRef = useRef(null);

  if (!isAdmin) {
    return (
      <div style={{ padding: '48px 40px', textAlign: 'center' }}>
        <h2>Only admins can open this page.</h2>
        <Link to="/staff" style={{ color: 'var(--brand-red)', fontWeight: 700, marginTop: '16px', display: 'inline-block' }}>
          Back to dashboard
        </Link>
      </div>
    );
  }

  const handleDownloadTemplate = () => {
    const csvContent = 'first_name,last_name,email,phone,country,faculty\nMaria,Popescu,maria.popescu@example.com,+40 700 111 222,Romania,Letters\nLucia,Fernandez,lucia.fernandez@example.com,+34 600 112 233,Spain,Sciences\n';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'ucv_students_import_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return;
    if (!selectedFile.name.endsWith('.csv')) {
      setError('Please select a valid CSV file.');
      return;
    }
    setFile(selectedFile);
    setError(null);
    setCommitResult(null);
    uploadPreview(selectedFile);
  };

  const uploadPreview = async (fileToUpload) => {
    try {
      setUploading(true);
      setError(null);
      const formData = new FormData();
      formData.append('file', fileToUpload);

      const res = await api.post('/staff/import/preview', formData);
      setPreviewData(res);
    } catch (err) {
      setError(err.message || 'Failed to process CSV file.');
    } finally {
      setUploading(false);
    }
  };

  const handleCommitImport = async () => {
    if (!previewData?.jobId) return;
    try {
      setCommitting(true);
      setError(null);
      const res = await api.post('/staff/import/commit', {
        jobId: previewData.jobId,
        sendInvites
      });
      setCommitResult(res);
      showToast({ message: 'Students successfully imported!', type: 'success' });
    } catch (err) {
      setError(err.message || 'Failed to commit import.');
    } finally {
      setCommitting(false);
    }
  };

  const counts = previewData?.counts || { newCount: 0, updateCount: 0, missingEmailCount: 0, fixCount: 0 };
  const totalValid = (counts.newCount || 0) + (counts.updateCount || 0) + (counts.missingEmailCount || 0);

  return (
    <div className="staff-page-container">
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: '32px', fontWeight: 800 }}>
            Import students
          </h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '15px' }}>
            Admins only. Bulk upload approved students from Excel or CSV.
          </p>
        </div>

        <Link
          to="/staff/students"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            height: '44px',
            padding: '0 18px',
            borderRadius: '10px',
            border: '1.5px solid var(--navy)',
            backgroundColor: 'var(--white)',
            color: 'var(--navy)',
            fontWeight: 700,
            fontSize: '15px',
            textDecoration: 'none'
          }}
        >
          <ArrowLeft size={16} />
          Back to students
        </Link>
      </header>

      {error && <ErrorAlert message={error} />}

      <div className="staff-import-grid">
        {/* Left Card: How it works */}
        <section className="staff-section-card">
          <h2 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: '20px', fontWeight: 800 }}>
            How it works
          </h2>

          <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <span
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--navy)',
                  color: 'var(--white)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '13px',
                  flexShrink: 0
                }}
              >
                1
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontWeight: 700, fontSize: '14px' }}>Download the template</span>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '18px' }}>
                  One row per student: first_name, last_name, email, phone, country, faculty.
                </span>
              </div>
            </li>

            <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <span
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--navy)',
                  color: 'var(--white)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '13px',
                  flexShrink: 0
                }}
              >
                2
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontWeight: 700, fontSize: '14px' }}>Upload your CSV</span>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '18px' }}>
                  Exported from Excel (auto-detects semicolon or comma) or Google Sheets.
                </span>
              </div>
            </li>

            <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <span
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--navy)',
                  color: 'var(--white)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '13px',
                  flexShrink: 0
                }}
              >
                3
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontWeight: 700, fontSize: '14px' }}>Check the preview</span>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '18px' }}>
                  Problems and invalid rows are classified before anything is stored.
                </span>
              </div>
            </li>

            <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <span
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--navy)',
                  color: 'var(--white)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '13px',
                  flexShrink: 0
                }}
              >
                4
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontWeight: 700, fontSize: '14px' }}>Import</span>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '18px' }}>
                  Existing students are updated by email, new ones are added. Nobody is deleted.
                </span>
              </div>
            </li>
          </ol>

          <button
            type="button"
            onClick={handleDownloadTemplate}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              height: '42px',
              padding: '0 16px',
              borderRadius: '10px',
              border: '1.5px solid var(--navy)',
              backgroundColor: 'var(--white)',
              color: 'var(--navy)',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer',
              alignSelf: 'flex-start',
              marginTop: '8px'
            }}
          >
            <Download size={16} />
            Download template (CSV)
          </button>
        </section>

        {/* Right Section: Dropzone & Preview Table */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* File Upload Box */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              if (e.dataTransfer.files?.[0]) {
                handleFileSelect(e.dataTransfer.files[0]);
              }
            }}
            style={{
              padding: '28px',
              borderRadius: '20px',
              border: dragOver ? '2px dashed var(--brand-red)' : '2px dashed #9AA3B8',
              backgroundColor: dragOver ? '#FDF3D3' : 'var(--white)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              transition: 'all 150ms'
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              style={{ display: 'none' }}
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  handleFileSelect(e.target.files[0]);
                }
              }}
            />

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <Upload size={32} color="var(--navy)" style={{ flexShrink: 0 }} />
              <div>
                <span style={{ fontWeight: 700, fontSize: '16px', display: 'block' }}>
                  {file ? file.name : 'Choose or drop a CSV file here'}
                </span>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  {file && previewData
                    ? `${previewData.rows?.length || 0} rows parsed`
                    : 'Up to 2 MB and 2,000 rows'}
                </span>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              loading={uploading}
            >
              {file ? 'Choose another file' : 'Select CSV'}
            </Button>
          </div>

          {/* Preview Section */}
          {previewData && (
            <section
              style={{
                backgroundColor: 'var(--white)',
                border: '1px solid var(--border)',
                borderRadius: '20px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <h2 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: '20px', fontWeight: 800 }}>
                  Preview
                </h2>

                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      height: '26px',
                      padding: '0 10px',
                      borderRadius: '999px',
                      backgroundColor: '#E8F5EE',
                      color: '#17633D',
                      fontSize: '12px',
                      fontWeight: 700
                    }}
                  >
                    {counts.newCount} new
                  </span>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      height: '26px',
                      padding: '0 10px',
                      borderRadius: '999px',
                      backgroundColor: '#E4E9F4',
                      color: 'var(--navy)',
                      fontSize: '12px',
                      fontWeight: 700
                    }}
                  >
                    {counts.updateCount} updates
                  </span>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      height: '26px',
                      padding: '0 10px',
                      borderRadius: '999px',
                      backgroundColor: '#FDF3D3',
                      color: '#5C4A00',
                      fontSize: '12px',
                      fontWeight: 700
                    }}
                  >
                    {counts.missingEmailCount} missing email
                  </span>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      height: '26px',
                      padding: '0 10px',
                      borderRadius: '999px',
                      backgroundColor: '#FBEAE8',
                      color: '#8F1B12',
                      fontSize: '12px',
                      fontWeight: 700
                    }}
                  >
                    {counts.fixCount} to fix
                  </span>
                </div>
              </div>

              {/* Table */}
              <div style={{ overflowX: 'auto', maxHeight: '380px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, backgroundColor: 'var(--white)' }}>
                      <th style={{ padding: '10px 12px', fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)' }}>Name</th>
                      <th style={{ padding: '10px 12px', fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)' }}>Email</th>
                      <th style={{ padding: '10px 12px', fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)' }}>Country</th>
                      <th style={{ padding: '10px 12px', fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)' }}>Faculty</th>
                      <th style={{ padding: '10px 12px', fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)' }}>Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.rows?.slice(0, 50).map((r, i) => {
                      const isNew = r.status === 'new';
                      const isUpdate = r.status === 'update';
                      const isMissingEmail = r.status === 'missing_email';
                      const isFix = r.status === 'fix';

                      const badgeBg = isNew
                        ? '#E8F5EE'
                        : isUpdate
                        ? '#E4E9F4'
                        : isMissingEmail
                        ? '#FDF3D3'
                        : '#FBEAE8';
                      const badgeFg = isNew
                        ? '#17633D'
                        : isUpdate
                        ? 'var(--navy)'
                        : isMissingEmail
                        ? '#5C4A00'
                        : '#8F1B12';
                      const badgeText = isNew
                        ? 'New'
                        : isUpdate
                        ? 'Update'
                        : isMissingEmail
                        ? 'Missing email'
                        : r.issue || 'To fix';

                      return (
                        <tr key={i} style={{ borderBottom: '1px solid var(--paper)' }}>
                          <td style={{ padding: '10px 12px', fontWeight: 700 }}>{r.fullName}</td>
                          <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>{r.email || '—'}</td>
                          <td style={{ padding: '10px 12px' }}>{getCountryName(r.countryCode) || r.countryCode}</td>
                          <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>{r.faculty || '—'}</td>
                          <td style={{ padding: '10px 12px' }}>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                height: '24px',
                                padding: '0 8px',
                                borderRadius: '999px',
                                backgroundColor: badgeBg,
                                color: badgeFg,
                                fontSize: '12px',
                                fontWeight: 700
                              }}
                            >
                              {badgeText}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Commit action bar */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '16px',
                  paddingTop: '12px',
                  borderTop: '1px solid var(--border)'
                }}
              >
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  Rows to fix are skipped. Students without email are saved and cannot log in until staff add an email.
                </span>

                {!commitResult ? (
                  <Button
                    onClick={handleCommitImport}
                    loading={committing}
                    disabled={totalValid === 0}
                  >
                    Import {totalValid} students
                  </Button>
                ) : (
                  <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--forest)' }}>
                    Imported: {commitResult.insertedCount || counts.newCount} added,{' '}
                    {commitResult.updatedCount || counts.updateCount} updated.
                  </span>
                )}
              </div>
            </section>
          )}
        </div>
      </div>

      <style>{`
        .staff-import-grid {
          display: grid;
          grid-template-columns: minmax(300px, 360px) minmax(0, 1fr);
          gap: 24px;
          align-items: start;
        }
        @media (max-width: 900px) {
          .staff-import-grid {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
        }
      `}</style>
    </div>
  );
}
