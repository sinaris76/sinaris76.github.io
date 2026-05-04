# _plugins/bib_to_search.rb
# Reads _bibliography/papers.bib and populates site.data['pub_search']
# so the Cmd+K search index auto-updates whenever you edit papers.bib.

Jekyll::Hooks.register :site, :after_read do |site|
  bib_file = File.join(site.source, '_bibliography', 'papers.bib')
  next unless File.exist?(bib_file)

  begin
    require 'bibtex'

    # Strip Jekyll front matter (--- ... ---) before parsing
    content = File.read(bib_file).gsub(/\A---\s*\n.*?---\s*\n/m, '')
    bib = BibTeX.parse(content)

    publications = []
    bib.each do |entry|
      next unless entry.respond_to?(:title)

      title = entry.title.to_s.gsub(/[{}]/, '').gsub(/\s+/, ' ').strip
      next if title.empty?

      # Resolve URL: prefer doi > arxiv > website > url > fallback
      doi = entry.respond_to?(:doi) ? entry.doi.to_s.strip : ''
      arxiv = entry.respond_to?(:arxiv) ? entry.arxiv.to_s.strip : ''
      website = entry.respond_to?(:website) ? entry.website.to_s.strip : ''
      raw_url = entry.respond_to?(:url) ? entry.url.to_s.strip : ''

      url = if doi != ''
        doi.start_with?('http') ? doi : "https://doi.org/#{doi}"
      elsif arxiv != ''
        "https://arxiv.org/abs/#{arxiv}"
      elsif website != ''
        website
      elsif raw_url != ''
        raw_url
      else
        '/publications/'
      end

      publications << {
        'title' => title,
        'url'   => url,
        'year'  => entry.respond_to?(:year) ? entry.year.to_s : ''
      }
    end

    site.data['pub_search'] = publications
    Jekyll.logger.info "BibSearch:", "Indexed #{publications.size} publication(s) for search."
  rescue => e
    Jekyll.logger.warn "BibSearch:", "Could not parse bibliography: #{e.message}"
  end
end
