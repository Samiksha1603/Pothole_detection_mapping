import React, { useEffect, useState } from "react";
import { collection, getDocs, query } from "firebase/firestore";
import { db } from "../firebase.config";
import { Input, Button, Table, Select, DatePicker, Space, Tag, Card, notification, Row, Col, Collapse, Carousel, Tooltip, Heatmap } from "antd";
import Map from 'react-leaflet';
import { getDatabase, ref, get } from "firebase/database";
import { MapContainer, TileLayer, Circle } from 'react-leaflet';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Panel } = Collapse;



const PotholeMap = ({ potholes }) => {
  const center = [/* Set your default center coordinates here */];
  const zoom = 13;

  return (
    <MapContainer center={center} zoom={zoom} style={{ height: '400px', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {potholes &&
        potholes.map((pothole) => (
          <Circle
            key={pothole.id}
            center={[pothole.latitude, pothole.longitude]}
            radius={50} // Adjust the radius as needed
            color="red"
            fillColor="red"
            fillOpacity={0.5}
          />
        ))}
    </MapContainer>
  );
};


const About = () => {
  const [potholes, setPotholes] = useState(null);
  const [filteredPotholes, setFilteredPotholes] = useState(null);
  const [severityFilter, setSeverityFilter] = useState(null);
  const [statusFilter, setStatusFilter] = useState(null);
  const [dateFilter, setDateFilter] = useState(null);

  const auth = getAuth();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchPotholes = async () => {
      try {
        const potholeRef = collection(db, "potholes");
        const q = query(potholeRef);

        // Ensure the user is authenticated
        onAuthStateChanged(auth, (user) => {
          if (user) {
            setUser(user);

            // Fetch data according to the security rules
            getDocs(q).then((querysnap) => {
              let potholeData = [];
              querysnap.forEach((doc) => {
                const data = doc.data();
                potholeData.push({
                  id: doc.id,
                  latitude: data.location?._lat,
                  longitude: data.location?._long,
                  locationName: data.locationName,
                  dateDetected: data.dateDetected,
                  status: data.status,
                  severity: data.severity,
                });
              });
              
              setFilteredPotholes(potholeData);
            });
          } else {
            // User is not authenticated, handle accordingly
          }
        });
      } catch (error) {
        console.error("Error fetching potholes: ", error);
      }
    };

    fetchPotholes();
  }, [auth]);

  useEffect(() => {
    const fetchPotholes = async () => {
      try {
        const database = getDatabase();
        const potholeRef = ref(database, "readings");
        const snapshot = await get(potholeRef);
        const potholeData = [];

        if (snapshot.exists()) {
          snapshot.forEach((childSnapshot) => {
            potholeData.push({
              id: childSnapshot.key,
              data: childSnapshot.val(),
            });
          });
          setPotholes(potholeData);
        } else {
          console.log("No data available");
        }
      } catch (error) {
        console.error("Error fetching potholes: ", error);
      }
    };

    fetchPotholes();
  }, []);

  console.log(potholes)



  const handleStatusUpdate = (potholeId, newStatus) => {
    // Implement logic to update pothole status in the database
    console.log(`Updating status of pothole ${potholeId} to ${newStatus}`);
    notification.success({
      message: "Status Updated",
      description: `Status of pothole ${potholeId} has been updated to ${newStatus}`,
    });
  };

  const handleExportData = () => {
    // Implement logic to export data
    console.log("Exporting data...");
  };

  const handleSearch = (value) => {
    // Implement search logic
    console.log(`Searching for: ${value}`);
  };

  const renderStatusButton = (potholeId, status) => {
    let color = 'default';
    switch (status) {
      case 'pending':
        color = 'gold';
        break;
      case 'in-progress':
        color = 'processing';
        break;
      case 'resolved':
        color = 'success';
        break;
      default:
        break;
    }

    return (
      <Tag color={color} onClick={() => handleStatusUpdate(potholeId, 'resolved')}>
        {status}
      </Tag>
    );
  };

  const handleFilter = () => {
    // Implement filtering logic based on severity, status, and date
    let filteredData = potholes;

    if (severityFilter) {
      filteredData = filteredData.filter(item => item.data.severity === severityFilter);
    }

    if (statusFilter) {
      filteredData = filteredData.filter(item => item.data.status === statusFilter);
    }

    if (dateFilter) {
      filteredData = filteredData.filter(item => item.data.dateDetected === dateFilter);
    }

    setFilteredPotholes(filteredData);
  };

  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      <Row gutter={16}>
        {/* Left Side Filter Bar */}
        <Col span={6}>
          <Card title="Filters" className="mb-4">
            <Collapse defaultActiveKey={['1', '2', '3']}>
              <Panel header="Severity" key="1">
                <Select
                  placeholder="Select Severity"
                  onChange={(value) => setSeverityFilter(value)}
                >
                  <Option value="low">Low</Option>
                  <Option value="medium">Medium</Option>
                  <Option value="high">High</Option>
                </Select>
              </Panel>
              <Panel header="Status" key="2">
                <Select
                  placeholder="Select Status"
                  onChange={(value) => setStatusFilter(value)}
                >
                  <Option value="pending">Pending</Option>
                  <Option value="in-progress">In Progress</Option>
                  <Option value="resolved">Resolved</Option>
                </Select>
              </Panel>
              <Panel header="Date Range" key="3">
                <RangePicker
                  onChange={(dates) => setDateFilter(dates)}
                />
              </Panel>
            </Collapse>
            <Button type="primary" onClick={handleFilter} className="mt-4">
              Apply Filters
            </Button>
          </Card>
        </Col>

        {/* Main Content */}
        <Col span={18}>
          <h1 className="text-3xl font-bold mb-4 text-blue-800">Road Maintenance Dashboard</h1>

          {/* Map Integration */}
          <Card title="Pothole Map" className="mb-4">
            {/* Add your map component here */}
          </Card>

          {/* Table with Pothole Data */}
          {/* Table with Pothole Data */}
          {filteredPotholes ? (
            <Table
              dataSource={filteredPotholes}
              columns={[
                {
                  title: 'Latitude',
                  dataIndex: 'latitude',
                  key: 'latitude', // Unique key added
                  align: 'center',
                },
                {
                  title: 'Longitude',
                  dataIndex: 'longitude',
                  key: 'longitude', // Unique key added
                  align: 'center',
                },
                {
                  title: 'Location',
                  dataIndex: 'locationName',
                  key: 'location',
                  align: 'center',
                },
                {
                  title: 'Date Detected',
                  dataIndex: 'dateDetected',
                  key: 'date',
                  align: 'center',
                },
                {
                  title: 'Status',
                  key: 'status',
                  align: 'center',
                  render: (record) => renderStatusButton(record.id, record.status),
                },
              ]}
            />
          ) : (
            <p className="p-4 text-center text-gray-600">No Potholes</p>
          )}
          {/* Status Update Button */}
          {/* Comments/Notes Section */}
          <Card title="Pothole Details" className="mb-4">
            {/* Your comments/notes section goes here */}
          </Card>

          {/* Export Data Button */}
          <Button type="primary" onClick={handleExportData} className="mb-4">
            Export Data
          </Button>

          {/* Search Functionality */}
          <Input.Search
            placeholder="Search by ID, Location, etc."
            onSearch={handleSearch}
            enterButton
            className="mb-4"
          />

          {/* Color-coded Severity */}
          <Card title="Severity Overview" className="mb-4">
            {/* Add your severity overview component or chart here */}
          </Card>

          {/* Dashboard Overview */}
          <Card title="Dashboard Overview" className="mb-4">
            {/* Add your dashboard overview component or chart here */}
          </Card>

          {/* Notification System */}
          <Button type="primary" onClick={() => notification.success({ message: 'Success', description: 'This is a success notification.' })} className="mb-4">
            Show Notification
          </Button>

          {/* User Authentication (dummy placeholder) */}
          <Card title="User Authentication" className="mb-4">
            <p>Authenticated as: Administrator</p>
          </Card>

  
          {/* Heatmap Visualization */}
          <Card title="Pothole Density Heatmap" className="mb-4">
            {/* Add your heatmap component here */}
          </Card>

          {/* Printable Reports */}
          <Button type="primary" className="mb-4">
            Generate Printable Report
          </Button>

          {/* Feedback Mechanism (dummy placeholder) */}
          <Card title="Feedback Mechanism" className="mb-4">
            <p>Please provide your feedback on the system:</p>
            {/* Add your feedback form or input here */}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default About;
