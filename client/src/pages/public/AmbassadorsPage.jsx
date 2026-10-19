import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { Skeleton } from '../../components/Skeleton.jsx';
import { api } from '../../lib/api.js';
import { useAuth } from '../../context/AuthContext.jsx';

export function AmbassadorsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { isStudent } = useAuth();

  useEffect(() => {
    async function fetchAmbassadors() {
      try {
        const res = await api.get('/public/ambassadors');
        setData(res);
      } catch (err) {
        console.error('Failed to load ambassadors info:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchAmbassadors();
  }, []);

  const duties = [
    { title: 'Welcome new students', text: 'Be a friendly contact in their first weeks in Craiova.' },
    { title: 'Promote activities', text: 'Share events with your faculty, hostel and friends.' },
    { title: 'Help organise events', text: 'Set up rooms, welcome guests and host club meetings.' },
    { title: 'Bring people in', text: 'Invite students from your country or faculty.' },
    { title: 'Suggest ideas', text: 'Tell us what students would love to do next.' },
    { title: 'Help newcomers settle in', text: 'Answer questions and help people feel at home.' }
  ];

  const numberWanted = data?.numberWanted || '10 to 15';
  const applyByDate = data?.applyByDate || '15 November 2026';
  const firstMeeting = data?.firstMeeting || 'Wednesday 18 November 2026, 16:00, IR Office';
  const certificateLine = data?.certificateLine || 'Official volunteering certificate from the University of Craiova';
  const isOpen = data?.isOpen ?? true;

  return (
    <div
      className="ambassadors-page-container"
      style={{
        backgroundColor: '#F2F3F6',
        minHeight: 'calc(100vh - 112px)',
        display: 'flex',
        flexDirection: 'column',
        padding: '48px 64px 64px'
      }}
    >
      <div
        style={{
          maxWidth: '1328px',
          margin: '0 auto',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '40px'
        }}
      >
        {/* Hero Section */}
        <section
          className="ambassadors-hero-section"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '48px',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ flex: '1 1 540px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <span style={{ fontSize: '17px', fontWeight: 700, color: '#B42318' }}>
              UCV International Student Ambassadors
            </span>
            <h1
              style={{
                margin: 0,
                fontFamily: 'var(--font-heading)',
                fontWeight: 800,
                fontSize: 'clamp(38px, 4.5vw, 60px)',
                lineHeight: 1.08,
                letterSpacing: '-1.5px',
                color: '#18203A'
              }}
            >
              Be the first friendly face in Craiova
            </h1>
            <p style={{ margin: 0, maxWidth: '560px', fontSize: '19px', lineHeight: '29px', color: '#2E3650' }}>
              Ambassadors welcome new students, help run our events and keep the community going from one semester to the next. International and Romanian students are both welcome.
            </p>
          </div>

          <aside
            className="ambassadors-hero-aside"
            style={{
              width: '460px',
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              padding: '34px',
              borderRadius: '24px',
              backgroundColor: '#18203A',
              color: '#FFFFFF',
              boxShadow: '0 12px 32px rgba(24, 32, 58, 0.15)'
            }}
          >
            <span style={{ fontSize: '15px', fontWeight: 700, color: '#F2B705' }}>
              {isOpen ? 'Applications are open' : 'Applications currently closed'}
            </span>
            <span
              style={{
                fontFamily: 'var(--font-heading)',
                fontWeight: 800,
                fontSize: '28px',
                lineHeight: '34px',
                color: '#FFFFFF'
              }}
            >
              We're looking for 10 ambassadors this year
            </span>
            <span style={{ fontSize: '16px', lineHeight: '24px', color: '#E4E9F4' }}>
              International and Romanian students, from any faculty.
            </span>
            {isOpen && (
              <Link
                to={isStudent ? '/student/ambassadors' : '/signin'}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '52px',
                  marginTop: '6px',
                  borderRadius: '12px',
                  backgroundColor: '#F2B705',
                  color: '#18203A',
                  fontWeight: 700,
                  fontSize: '16px',
                  textDecoration: 'none'
                }}
              >
                Apply to be an ambassador
              </Link>
            )}
          </aside>
        </section>

        {/* What Ambassadors Do */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h2
            style={{
              margin: 0,
              fontFamily: 'var(--font-heading)',
              fontWeight: 800,
              fontSize: '34px',
              lineHeight: '40px',
              color: '#18203A'
            }}
          >
            What ambassadors do
          </h2>
          <div
            className="ambassadors-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
              gap: '16px'
            }}
          >
            {duties.map((d, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  gap: '16px',
                  alignItems: 'flex-start',
                  padding: '22px',
                  borderRadius: '18px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #D9DDE6'
                }}
              >
                <span
                  style={{
                    width: '36px',
                    height: '36px',
                    flexShrink: 0,
                    borderRadius: '50%',
                    backgroundColor: '#FDF3D3',
                    color: '#8A6D00',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Check size={18} strokeWidth={2.6} />
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontWeight: 700, fontSize: '18px', lineHeight: '24px', color: '#18203A' }}>
                    {d.title}
                  </span>
                  <span style={{ fontSize: '15px', lineHeight: '22px', color: '#4A536B' }}>
                    {d.text}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 3-Column Section: How it works / First meeting / What you get */}
        {/* <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}> */}
          {/* How it works */}
          {/* <section
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              padding: '30px',
              borderRadius: '22px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #D9DDE6'
            }}
          >
            <h2
              style={{
                margin: 0,
                fontFamily: 'var(--font-heading)',
                fontWeight: 800,
                fontSize: '26px',
                lineHeight: '32px',
                color: '#18203A'
              }}
            >
              How it works
            </h2>
            <ol
              style={{
                margin: 0,
                padding: 0,
                listStyle: 'none',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px'
              }}
            >
              <li style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', fontSize: '16px', lineHeight: '24px', color: '#2E3650' }}>
                <span
                  style={{
                    width: '30px',
                    height: '30px',
                    flexShrink: 0,
                    borderRadius: '50%',
                    backgroundColor: '#18203A',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    fontWeight: 700
                  }}
                >
                  1
                </span>
                Apply with the short form, or tick "ambassador" when you join
              </li>
              <li style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', fontSize: '16px', lineHeight: '24px', color: '#2E3650' }}>
                <span
                  style={{
                    width: '30px',
                    height: '30px',
                    flexShrink: 0,
                    borderRadius: '50%',
                    backgroundColor: '#18203A',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    fontWeight: 700
                  }}
                >
                  2
                </span>
                Have a short chat with the International Relations team
              </li>
              <li style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', fontSize: '16px', lineHeight: '24px', color: '#2E3650' }}>
                <span
                  style={{
                    width: '30px',
                    height: '30px',
                    flexShrink: 0,
                    borderRadius: '50%',
                    backgroundColor: '#18203A',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    fontWeight: 700
                  }}
                >
                  3
                </span>
                Join the ambassadors' WhatsApp group
              </li>
              <li style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', fontSize: '16px', lineHeight: '24px', color: '#2E3650' }}>
                <span
                  style={{
                    width: '30px',
                    height: '30px',
                    flexShrink: 0,
                    borderRadius: '50%',
                    backgroundColor: '#18203A',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    fontWeight: 700
                  }}
                >
                  4
                </span>
                Come to the first meeting and pick your role
              </li>
            </ol>
          </section> */}

          {/* First meeting */}
          {/* <section
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              padding: '30px',
              borderRadius: '22px',
              backgroundColor: '#18203A',
              color: '#FFFFFF'
            }}
          >
            <h2
              style={{
                margin: 0,
                fontFamily: 'var(--font-heading)',
                fontWeight: 800,
                fontSize: '26px',
                lineHeight: '32px',
                color: '#FFFFFF'
              }}
            >
              First meeting
            </h2>
            <span style={{ fontSize: '15px', color: '#C9D0E4' }}>
              {firstMeeting}
            </span>
            <ul
              style={{
                margin: 0,
                paddingLeft: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                fontSize: '16px',
                lineHeight: '24px',
                color: '#E4E9F4'
              }}
            >
              <li>Meet the team and the International Relations Department</li>
              <li>Roles: club hosts, buddies, event helpers, promotion</li>
              <li>Plan for the welcome evening on 21 October</li>
              <li>Ideas for the year and how we stay in touch</li>
            </ul>
          </section> */}

          {/* What you get */}
          {/* <section
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              padding: '30px',
              borderRadius: '22px',
              backgroundColor: '#FDF3D3'
            }}
          >
            <h2
              style={{
                margin: 0,
                fontFamily: 'var(--font-heading)',
                fontWeight: 800,
                fontSize: '26px',
                lineHeight: '32px',
                color: '#18203A'
              }}
            >
              What you get
            </h2>
            <ul
              style={{
                margin: 0,
                paddingLeft: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                fontSize: '16px',
                lineHeight: '24px',
                color: '#2E3650'
              }}
            >
              <li>Friends from all over the world</li>
              <li>Leadership and event experience for your CV</li>
              <li>{certificateLine}</li>
            </ul>
          </section> */}
        {/* </div> */}
      </div>

      <style>{`
        @media (max-width: 900px) {
          .ambassadors-page-container {
            padding: 24px 16px 48px !important;
            gap: 24px !important;
            width: 100% !important;
            box-sizing: border-box !important;
          }
          .ambassadors-hero-section {
            flex-direction: column !important;
            gap: 20px !important;
            width: 100% !important;
          }
          .ambassadors-hero-aside {
            width: 100% !important;
            max-width: 100% !important;
            flex-shrink: 1 !important;
            padding: 24px 18px !important;
            box-sizing: border-box !important;
          }
          .ambassadors-grid,
          .ambassadors-cards-grid {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
            width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
}
