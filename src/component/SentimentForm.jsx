import React, { useState } from 'react';
import axios from 'axios';
import Airtable from 'airtable';
import RecordComponent from './RecordComponent';
import 'react-calendar/dist/Calendar.css';
import './recordcomponent.css';

const SentimentAnalysisComponent = () => {
  const [identifierInput, setIdentifierInput] = useState('');
  const [textInput, setTextInput] = useState('');
  const [dateInput, setDateInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState(null);

  const handleIdentifierInputChange = (event) => {
    setIdentifierInput(event.target.value);
  };

  const handleTextInputChange = (event) => {
    setTextInput(event.target.value);
  };

  const handleDateInputChange = (event) => {
    setDateInput(event.target.value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    const data = { inputs: textInput };

    try {
      const response = await axios.post(
        'https://api-inference.huggingface.co/models/cardiffnlp/twitter-roberta-base-sentiment',
        data,
        {
          headers: {
            Authorization: `Bearer ${process.env.REACT_APP_HF_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.status !== 200) {
        throw new Error('Failed to analyze sentiment');
      }

      const result = response.data;
      setOutput(JSON.stringify(result));
      setLoading(false);

      const base = new Airtable({apiKey: process.env.REACT_APP_AIRTABLE_KEY}).base('appc0R8Td9MlWj7UL');
      base('Table 1').create(
        [
          {
            fields: {
              Identifier: identifierInput,
              Date: dateInput,
              Journal: textInput,
              Result: JSON.stringify(result),
            },
          },
        ],
        function (err, records) {
          if (err) {
            console.error(err);
            return;
          }
          records.forEach(function (record) {
            console.log(record.getId());
          });
        }
      );
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  return (  
    <div className="container all">
      <div className="title">
        <h1>🧠 AI Journal</h1>
      </div>
      <div className="information">
        <div className="information__content">
          <p>Hello, world! This a unique free AI-supported journal that automatically detect sentiments for each journal entry. </p>
          <p>Note: the current app functions as a demo to explore the opportunities of AI in mental health and should not be interpreted as actual means for psychological aid. Please do not disclose any sensitive or personally identifiable information. All data shall automatically be deleted after 7 days. By using the app, you agree to our terms.</p>
        </div>
      </div>
      <div className="section">
        <div className="container al-c mt-3">
          <form className="gen-form" onSubmit={handleSubmit}>
            <div className="token__date">
              <div className="token">
                <p>Nickname (Use the same nickname for each log)</p>
                <input
                  className="api__token"
                  type="text"
                  name="identifierInput"
                  placeholder="e.g. bryan"
                  value={identifierInput}
                  onChange={handleIdentifierInputChange}
                />
              </div>
              <div className="date">
                <p>Date</p>
                <input
                  type="date"
                  name="dateInput"
                  value={dateInput}
                  onChange={handleDateInputChange}
                />
              </div>
            </div>
            <div className="text__input">
              <p>Journal</p>
              <textarea
                name="textInput"
                placeholder="Type your text here..."
                value={textInput}
                onChange={handleTextInputChange}
              ></textarea>
            </div>
            <div className="button__submit">
              <button type="submit">Log diary</button>
            </div>
          </form>
          <div className="result">
            {loading && <div className="loading">Submitting...</div>}
            {!loading && output && <p>Submitted</p>}
          </div>
        </div>
        <RecordComponent identifierInput={identifierInput} />
      </div>
      </div>
  );
};

export default SentimentAnalysisComponent;
