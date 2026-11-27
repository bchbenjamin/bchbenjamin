CREATE TABLE portfolio_analytics (
  day date NOT NULL, country varchar(2) NOT NULL, model varchar(80) NOT NULL,
  os varchar(30) NOT NULL, browser varchar(30) NOT NULL, source varchar(80) NOT NULL,
  medium varchar(80) NOT NULL, campaign varchar(80) NOT NULL,
  visits bigint NOT NULL DEFAULT 0,
  PRIMARY KEY(day,country,model,os,browser,source,medium,campaign)
);
CREATE TABLE portfolio_viewing_minutes (minute timestamptz PRIMARY KEY);
