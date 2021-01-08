import React from 'react';

const Title: React.FC = () => (
  <>
  
    <h1 className="title">
      Welcome to <a href="/chat">MaChat</a>
    </h1>
    <style jsx global>
      {`
        .title a {
          color: #0070f3;
          text-decoration: none;
          
        }

        .title a:hover,
        .title a:focus,
        .title a:active {
          text-decoration: underline;
        }

        .title {
          margin: 0;
          line-height: 1.125;
          font-size: 4rem;
          text-align: center;
        }
      `}
    </style>
  </>
);

export default Title;
