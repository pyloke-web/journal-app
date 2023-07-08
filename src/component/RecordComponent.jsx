import React, { useState, useEffect } from 'react';
import Airtable from 'airtable';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './recordcomponent.css';

const RecordComponent = ({ identifierInput }) => {
  const [records, setRecords] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [expandedEntryId, setExpandedEntryId] = useState(null);

  useEffect(() => {
    fetchRecords();
  }, [identifierInput]);

  const fetchRecords = () => {
    const base = new Airtable({ apiKey: process.env.REACT_APP_AIRTABLE_KEY }).base('appc0R8Td9MlWj7UL');
    base('Table 1')
      .select({
        view: 'Grid view',
        filterByFormula: `{Identifier} = '${identifierInput}'`
      })
      .eachPage(
        (retrievedRecords, fetchNextPage) => {
          setRecords(retrievedRecords);
          fetchNextPage();
        },
        (err) => {
          console.error(err);
        }
      );
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setExpandedEntryId(null);
  };

  const getRecordsBySelectedDate = () => {
    if (!selectedDate) {
      return [];
    }

    const selectedDateUTC = new Date(Date.UTC(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate(),
      0, 0, 0
    ));

    const selectedDateString = selectedDateUTC.toISOString().split('T')[0];

    return records.filter((record) => {
      const recordDateString = new Date(record.fields['Date']).toISOString().split('T')[0];
      return recordDateString === selectedDateString;
    });
  };

  const handleEntryToggle = (entryId) => {
    setExpandedEntryId((prevEntryId) => (prevEntryId === entryId ? null : entryId));
  };

  const handleRefresh = () => {
    fetchRecords();
  };

  return (
    <div className="container">
      <div className="calendar">
        <div className="refresh-button">
          <button onClick={handleRefresh}> ⏳ Refresh Calendar</button>
        </div>
        <Calendar onChange={handleDateSelect} value={selectedDate} />
      </div>
      {selectedDate && (
        <div className="calendar__content">
          <h2>{selectedDate.toDateString()}</h2>
          {getRecordsBySelectedDate().map((record) => (
            <div className="calendar__journal" key={record.id} onClick={() => handleEntryToggle(record.id)}>
              <p className="recordID">ID: {record.id}</p>
              <div className="score-bar">
                <div className="score-bar__positive" style={{ width: `${record.fields['pos'] * 100}%` }}></div>
                <div className="score-bar__neutral" style={{ width: `${record.fields['neu'] * 100}%` }}></div>
                <div className="score-bar__negative" style={{ width: `${record.fields['neg'] * 100}%` }}></div>
              </div>
              {expandedEntryId === record.id && (
                <div className="entry__details">
                  <div className="entry__sentiment">
                    <p>Postive: {(record.fields['pos'] * 100).toFixed(1)}</p>
                    <p>Neutral: {(record.fields['neu'] * 100).toFixed(1)}</p>
                    <p>Negative: {(record.fields['neg'] * 100).toFixed(1)}</p>
                  </div>
                  <p>Entry: {record.fields['Journal']}</p>
                </div>
              )}
              <hr />
            </div>
          ))}
          {getRecordsBySelectedDate().length === 0 && <p>No records found for the selected date.</p>}
        </div>
      )}
    </div>
  );
};

export default RecordComponent;
