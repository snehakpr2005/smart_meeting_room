import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { resourceApi } from '../api/axiosClient';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import AlertBanner from '../components/AlertBanner';
import Modal from '../components/Modal';
import {
  Tv,
  Projector,
  Volume2,
  Video,
  PhoneCall,
  Search,
  Filter,
  PlusCircle,
  Wrench,
  Trash2,
  CheckCircle2,
  AlertOctagon,
  HelpCircle,
} from 'lucide-react';

const Resources = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [resources, setResources] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Admin Add Modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [newResName, setNewResName] = useState('Projector');
  const [newResUnitNumber, setNewResUnitNumber] = useState('');
  const [newResStatus, setNewResStatus] = useState('available');

  const fetchResources = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const data = await resourceApi.getAllResources();
      setResources(data);
    } catch (err) {
      setErrorMsg('Failed to load shared resources: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  const getDeviceIcon = (name) => {
    const lower = (name || '').toLowerCase();
    if (lower.includes('projector')) return <Projector size={24} color="#2563eb" />;
    if (lower.includes('tv')) return <Tv size={24} color="#7c3aed" />;
    if (lower.includes('speaker')) return <Volume2 size={24} color="#059669" />;
    if (lower.includes('camera') || lower.includes('video')) return <Video size={24} color="#ea580c" />;
    if (lower.includes('phone') || lower.includes('conference')) return <PhoneCall size={24} color="#0284c7" />;
    return <Tv size={24} color="#64748b" />;
  };

  // Toggle status between available and broken (Admin & Facility Manager)
  const handleToggleStatus = async (res) => {
    const newStatus = res.status === 'available' ? 'broken' : 'available';
    try {
      setActionLoading(true);
      setErrorMsg('');
      await resourceApi.updateResource(res._id, {
        name: res.name,
        unitNumber: res.unitNumber,
        status: newStatus,
      });

      setSuccessMsg(
        `Resource "${res.name} #${res.unitNumber}" marked as ${newStatus.toUpperCase()}.`
      );
      await fetchResources();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to update resource status');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Resource (Admin only)
  const handleDeleteResource = async (res) => {
    if (!window.confirm(`Delete ${res.name} #${res.unitNumber}?`)) return;
    try {
      setActionLoading(true);
      setErrorMsg('');
      await resourceApi.deleteResource(res._id);
      setSuccessMsg(`Resource "${res.name} #${res.unitNumber}" deleted.`);
      await fetchResources();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to delete resource');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateResource = async (e) => {
    e.preventDefault();
    if (!newResName || !newResUnitNumber) {
      setErrorMsg('Device name and unit number are required.');
      return;
    }

    try {
      setModalLoading(true);
      setErrorMsg('');
      await resourceApi.createResource({
        name: newResName.trim(),
        unitNumber: Number(newResUnitNumber),
        status: newResStatus,
      });

      setSuccessMsg(`Resource "${newResName} #${newResUnitNumber}" added successfully.`);
      setAddModalOpen(false);
      setNewResUnitNumber('');
      await fetchResources();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to create resource');
    } finally {
      setModalLoading(false);
    }
  };

  const canManageStatus = user?.role === 'admin' || user?.role === 'facility_manager';
  const isAdmin = user?.role === 'admin';

  // Filters
  const filteredResources = resources.filter((res) => {
    const matchesSearch =
      res.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(res.unitNumber).includes(searchTerm);

    const matchesCategory =
      categoryFilter === 'ALL' || res.name.toLowerCase().includes(categoryFilter.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || res.status === statusFilter.toLowerCase();

    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div>
      <div className="page-header">
        <div className="page-header-info">
          <h1>Shared Equipment & Devices</h1>
          <p>
            Monitor shared hardware inventory including Projectors, TVs, Speakers, Video Cameras, and
            Conference Phones.
          </p>
        </div>

        {isAdmin && (
          <div className="page-header-actions">
            <button className="btn btn-primary" onClick={() => setAddModalOpen(true)}>
              <PlusCircle size={18} />
              <span>Register Equipment</span>
            </button>
          </div>
        )}
      </div>

      {errorMsg && <AlertBanner type="error" message={errorMsg} onClose={() => setErrorMsg('')} />}
      {successMsg && <AlertBanner type="success" message={successMsg} onClose={() => setSuccessMsg('')} />}

      {/* Filter and Search Bar */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            alignItems: 'center',
          }}
        >
          {/* Search Input */}
          <div style={{ position: 'relative' }}>
            <Search
              size={18}
              style={{
                position: 'absolute',
                left: '0.85rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94a3b8',
              }}
            />
            <input
              type="text"
              className="form-control"
              placeholder="Search equipment or unit #..."
              style={{ paddingLeft: '2.5rem' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Category Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={16} color="#64748b" />
            <select
              className="form-control"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="ALL">All Equipment Categories</option>
              <option value="projector">Projector</option>
              <option value="tv">TV</option>
              <option value="speaker">Speaker</option>
              <option value="video">Video Camera</option>
              <option value="phone">Conference Phone</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              className="form-control"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="available">Available</option>
              <option value="broken">Broken / Under Repair</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner text="Loading shared resource units from database..." />
      ) : filteredResources.length === 0 ? (
        <EmptyState
          icon={Tv}
          title="No Equipment Found"
          description={
            resources.length === 0
              ? 'No hardware resources are currently recorded in MongoDB.'
              : 'No equipment matches the chosen filter criteria.'
          }
          actionLabel={isAdmin ? 'Add Equipment' : 'Clear Filters'}
          onAction={() => {
            if (isAdmin && resources.length === 0) {
              setAddModalOpen(true);
            } else {
              setSearchTerm('');
              setCategoryFilter('ALL');
              setStatusFilter('ALL');
            }
          }}
        />
      ) : (
        <div className="resource-grid">
          {filteredResources.map((res) => {
            const isAvailable = res.status === 'available';

            return (
              <div
                key={res._id}
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderTop: isAvailable ? '4px solid #10b981' : '4px solid #ef4444',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 'var(--border-radius-md)',
                        backgroundColor: '#f1f5f9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {getDeviceIcon(res.name)}
                    </div>

                    <span className={isAvailable ? 'badge badge-available' : 'badge badge-broken'}>
                      <span className="badge-dot"></span>
                      {isAvailable ? 'Available' : 'Broken / Repair'}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.2rem' }}>
                    {res.name}
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.25rem' }}>
                    Hardware Unit: <strong>#{res.unitNumber}</strong>
                  </p>
                </div>

                {/* Management controls */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '0.85rem',
                    borderTop: '1px solid #f1f5f9',
                    gap: '0.5rem',
                  }}
                >
                  {canManageStatus ? (
                    <button
                      className={`btn btn-sm ${isAvailable ? 'btn-outline-danger' : 'btn-success'}`}
                      style={{ flex: 1 }}
                      disabled={actionLoading}
                      onClick={() => handleToggleStatus(res)}
                      title="Toggle operational status"
                    >
                      <Wrench size={14} />
                      <span>{isAvailable ? 'Mark Broken' : 'Mark Fixed'}</span>
                    </button>
                  ) : (
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      {isAvailable ? '✓ Ready for booking' : '⚠️ Maintenance in progress'}
                    </span>
                  )}

                  {isAdmin && (
                    <button
                      className="btn btn-outline-danger btn-sm"
                      title="Delete equipment entry"
                      disabled={actionLoading}
                      onClick={() => handleDeleteResource(res)}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Admin Add Resource Modal */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Register New Shared Equipment"
        footer={
          <>
            <button
              className="btn btn-secondary"
              onClick={() => setAddModalOpen(false)}
              disabled={modalLoading}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleCreateResource}
              disabled={modalLoading}
            >
              {modalLoading ? 'Saving...' : 'Register Equipment'}
            </button>
          </>
        }
      >
        <form onSubmit={handleCreateResource}>
          <div className="form-group">
            <label className="form-label">
              Device Category <span className="required">*</span>
            </label>
            <select
              className="form-control"
              value={newResName}
              onChange={(e) => setNewResName(e.target.value)}
              required
            >
              <option value="Projector">Projector</option>
              <option value="TV">TV</option>
              <option value="Speaker">Speaker</option>
              <option value="Video Camera">Video Camera</option>
              <option value="Conference Phone">Conference Phone</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">
              Unit Number <span className="required">*</span>
            </label>
            <input
              type="number"
              min="1"
              className="form-control"
              placeholder="e.g. 1, 2, 3"
              value={newResUnitNumber}
              onChange={(e) => setNewResUnitNumber(e.target.value)}
              required
            />
            <span className="form-text">
              Each unit within a device type must have a unique unit number.
            </span>
          </div>

          <div className="form-group">
            <label className="form-label">Initial Operational Status</label>
            <select
              className="form-control"
              value={newResStatus}
              onChange={(e) => setNewResStatus(e.target.value)}
            >
              <option value="available">Available (Operational)</option>
              <option value="broken">Broken (Under Maintenance)</option>
            </select>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Resources;
